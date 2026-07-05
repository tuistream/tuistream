<?php

namespace App\Services\Streaming;

use App\Models\TvChannel;
use Illuminate\Support\Facades\Process;

class VideoStreamingService
{
    protected string $rtmpHost;
    protected int $rtmpPort;
    protected string $hlsPort;
    protected string $dashPort;
    protected string $ffmpegPath;

    public function __construct()
    {
        $this->rtmpHost = config('tuistream.streaming.video.rtmp.host');
        $this->rtmpPort = (int) config('tuistream.streaming.video.rtmp.port');
        $this->hlsPort = config('tuistream.streaming.video.hls_port');
        $this->dashPort = config('tuistream.streaming.video.dash_port');
        $this->ffmpegPath = config('tuistream.ffmpeg_path', '/usr/bin/ffmpeg');
    }

    public function createChannel(TvChannel $channel): bool
    {
        $streamKey = $this->generateStreamKey();

        $channel->update([
            'stream_key' => $streamKey,
            'rtmp_url' => "rtmp://{$this->rtmpHost}:{$this->rtmpPort}/live/{$streamKey}",
            'hls_url' => "http://{$this->rtmpHost}:{$this->hlsPort}/hls/{$streamKey}.m3u8",
            'dash_url' => "http://{$this->rtmpHost}:{$this->dashPort}/dash/{$streamKey}.mpd",
        ]);

        return true;
    }

    public function startAutoSchedule(TvChannel $channel): bool
    {
        // FFmpeg command to stream a playlist of videos to RTMP
        $hlsPath = "/var/www/tuistream/hls/{$channel->stream_key}";

        $cmd = implode(' ', [
            $this->ffmpegPath,
            '-re',
            '-stream_loop -1',
            '-f concat',
            '-safe 0',
            '-i ' . storage_path("app/playlists/tv_{$channel->slug}.txt"),
            '-c:v libx264',
            '-preset veryfast',
            '-b:v ' . ($channel->bitrate ?? 4000) . 'k',
            '-maxrate ' . ($channel->bitrate ?? 4000) . 'k',
            '-bufsize ' . (($channel->bitrate ?? 4000) * 2) . 'k',
            '-vf scale=' . ($channel->resolution ?? '1920x1080'),
            '-c:a aac',
            '-b:a 128k',
            '-ar 44100',
            '-f flv',
            "rtmp://{$this->rtmpHost}:{$this->rtmpPort}/live/{$channel->stream_key}",
            '> /var/log/tuistream/tv_' . $channel->slug . '.log 2>&1 &',
        ]);

        Process::run($cmd);

        $channel->update([
            'last_stream_started_at' => now(),
        ]);

        return true;
    }

    public function stopStream(TvChannel $channel): bool
    {
        Process::run("pkill -f 'ffmpeg.*{$channel->stream_key}'");
        return true;
    }

    protected function generateStreamKey(): string
    {
        return bin2hex(random_bytes(16));
    }
}
