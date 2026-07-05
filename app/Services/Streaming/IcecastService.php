<?php

namespace App\Services\Streaming;

use App\Models\Station;
use Illuminate\Support\Facades\Process;

class IcecastService
{
    protected string $icecastHost;
    protected int $icecastPort;
    protected string $adminPassword;

    public function __construct()
    {
        $this->icecastHost = config('tuistream.streaming.audio.icecast.host');
        $this->icecastPort = (int) config('tuistream.streaming.audio.icecast.port');
        $this->adminPassword = config('tuistream.streaming.audio.icecast.admin_password');
    }

    public function createMount(Station $station): bool
    {
        // Icecast mount points are created dynamically when a source connects
        // The mount point is defined by the source client (Liquidsoap/FFmpeg)
        $station->update([
            'mount_point' => '/' . $station->slug,
            'stream_url' => "http://{$this->icecastHost}:{$this->icecastPort}/{$station->slug}",
            'stream_ssl_url' => "https://{$this->icecastHost}:8001/{$station->slug}",
        ]);

        return true;
    }

    public function getListeners(Station $station): int
    {
        try {
            $url = "http://{$this->icecastHost}:{$this->icecastPort}/admin/listclients?mount=/{$station->slug}";
            $response = Process::timeout(5)->run("curl -s -u admin:{$this->adminPassword} '{$url}'");
            $xml = simplexml_load_string($response->output());
            return (int) $xml?->source?->Listeners ?? 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    public function getStatus(Station $station): array
    {
        try {
            $url = "http://{$this->icecastHost}:{$this->icecastPort}/status-json.xsl?mount=/{$station->slug}";
            $response = Process::timeout(5)->run("curl -s '{$url}'");
            $data = json_decode($response->output(), true);

            $source = $data['icestats']['source'] ?? null;

            return [
                'is_online' => $source !== null,
                'listeners' => (int) ($source['listeners'] ?? 0),
                'peak_listeners' => (int) ($source['listener_peak'] ?? 0),
                'current_song' => $source['title'] ?? null,
                'bitrate' => (int) ($source['bitrate'] ?? 0),
            ];
        } catch (\Exception $e) {
            return [
                'is_online' => false,
                'listeners' => 0,
                'peak_listeners' => 0,
                'current_song' => null,
                'bitrate' => 0,
            ];
        }
    }
}
