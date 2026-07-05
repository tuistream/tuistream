<?php

namespace App\Services\Streaming;

use App\Models\Station;
use App\Models\Playlist;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class AutoDJService
{
    protected string $ffmpegPath;
    protected string $ffprobePath;

    public function __construct()
    {
        $this->ffmpegPath = config('tuistream.ffmpeg_path', '/usr/bin/ffmpeg');
        $this->ffprobePath = config('tuistream.ffprobe_path', '/usr/bin/ffprobe');
    }

    public function start(Station $station): bool
    {
        // Generate Liquidsoap configuration for this station
        $config = $this->generateLiquidsoapConfig($station);

        $configPath = "/etc/liquidsoap/tuistream/{$station->slug}.liq";
        Storage::disk('local')->put("liquidsoap/{$station->slug}.liq", $config);

        // Start Liquidsoap process
        $result = Process::timeout(10)->run(
            "liquidsoap {$configPath} > /var/log/tuistream/{$station->slug}.log 2>&1 &"
        );

        if ($result->successful()) {
            $station->update([
                'auto_dj_status' => 'running',
                'last_stream_started_at' => now(),
            ]);
            return true;
        }

        return false;
    }

    public function stop(Station $station): bool
    {
        // Kill the Liquidsoap process for this station
        Process::run("pkill -f 'liquidsoap.*{$station->slug}'");

        $station->update(['auto_dj_status' => 'stopped']);
        return true;
    }

    public function restart(Station $station): bool
    {
        $this->stop($station);
        sleep(2);
        return $this->start($station);
    }

    protected function generateLiquidsoapConfig(Station $station): string
    {
        $mountPoint = '/' . $station->slug;
        $icecastHost = config('tuistream.streaming.audio.icecast.host');
        $icecastPort = config('tuistream.streaming.audio.icecast.port');
        $sourcePassword = $station->source_password ?? config('tuistream.streaming.audio.icecast.source_password');
        $bitrate = $station->bitrate;
        $format = $station->audio_format;

        $playlistPath = storage_path("app/playlists/{$station->slug}.m3u");
        $isPublic = $station->is_public ? 'true' : 'false';

        // Generate M3U playlist file with current active playlist songs
        $this->generateM3U($station, $playlistPath);

        return <<<LIQ
#!/usr/bin/liquidsoap

# TuiStream AutoDJ Configuration
# Station: {$station->name}
# Generated: {$station->updated_at}

set("log.file", true)
set("log.file.path", "/var/log/tuistream/{$station->slug}.liq.log")
set("log.level", 3)

# Audio source from playlist
playlist = playlist("{$playlistPath}", mode="normal", reload=60)

# Apply crossfade
playlist = crossfade(start_next=3., fade_in=3., fade_out=3., playlist)

# Normalize volume
playlist = normalize(playlist)

# Output to Icecast
output.icecast(
    %{$format}(bitrate={$bitrate}, samplerate=44100, stereo=true),
    host="{$icecastHost}",
    port={$icecastPort},
    password="{$sourcePassword}",
    mount="{$mountPoint}",
    name="{$station->name}",
    description="{$station->description}",
    genre="{$station->genre}",
    url="{$station->website_url}",
    public={$isPublic},
    playlist
)
LIQ;
    }

    protected function generateM3U(Station $station, string $path): void
    {
        $entries = [];

        // Get active scheduled playlist or default playlist
        $activePlaylist = Playlist::where('station_id', $station->id)
            ->where('is_active', true)
            ->where('is_jingle_playlist', false)
            ->first();

        if ($activePlaylist) {
            foreach ($activePlaylist->media as $media) {
                $fullPath = storage_path("app/public/{$media->path}");
                if (file_exists($fullPath)) {
                    $entries[] = $fullPath;
                }
            }
        }

        Storage::put("playlists/{$station->slug}.m3u", implode("\n", $entries));
    }
}
