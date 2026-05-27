<?php

namespace Modules\Streaming\Services;

use Modules\Stations\Models\Station;

/**
 * Genera la configuración de NGINX con módulo RTMP para estaciones de video.
 *
 * Soporta:
 *  - Live Streaming (RTMP + HLS + DASH)
 *  - Stream Relay
 *  - TV Station (loop 24/7 via FFmpeg)
 *
 * Compatible con: AlmaLinux 9/10, Ubuntu 22/24, Debian 11/12
 */
class NginxRtmpConfigGenerator
{
    /**
     * Ruta base donde se almacenan los segmentos HLS.
     * Configurada por el instalador en /var/hls
     */
    private string $hlsBasePath;

    /**
     * Ruta base donde se almacenan los segmentos DASH.
     */
    private string $dashBasePath;

    /**
     * URL base del panel (para los hooks on_publish)
     */
    private string $panelUrl;

    public function __construct(
        string $hlsBasePath  = '/var/hls',
        string $dashBasePath = '/var/dash',
        string $panelUrl     = 'http://127.0.0.1:8000'
    ) {
        $this->hlsBasePath  = $hlsBasePath;
        $this->dashBasePath = $dashBasePath;
        $this->panelUrl     = $panelUrl;
    }

    /**
     * Genera la configuración RTMP/HTTP completa para una estación de video.
     *
     * @param Station $station
     * @return string
     */
    public function generate(Station $station): string
    {
        return match ($station->service_type) {
            'tv_station'   => $this->generateTvStation($station),
            'stream_relay' => $this->generateStreamRelay($station),
            default        => $this->generateLiveStreaming($station),
        };
    }

    /**
     * Live Streaming — RTMP ingest + HLS + DASH output.
     * OBS/FFmpeg publican a: rtmp://SERVER:1935/live/STREAM_KEY
     */
    private function generateLiveStreaming(Station $station): string
    {
        $slug      = $station->slug;
        $streamKey = $station->stream_key ?? $slug;
        $hls       = "{$this->hlsBasePath}/live/{$slug}";
        $dash      = "{$this->dashBasePath}/live/{$slug}";
        $httpPort  = $station->port;
        $rtmpPort  = ($station->port + 1000);

        // GeoIP locking
        $geoipConf = $station->geoip_locking
            ? "# GeoIP locking enabled — configure via geo_module in main nginx.conf\n            deny 0.0.0.0/0;"
            : "allow publish all;\n            allow play all;";

        // nDVR (time-shift rewind)
        $ndvrConf = $station->ndvr_rewind
            ? "recorder dvr {\n                record all;\n                record_path {$hls}/dvr;\n                record_max_size 1024M;\n                record_unique on;\n            }"
            : '# nDVR disabled';

        // Stream targets (re-streaming to platforms)
        $pushConf = $this->buildPushTargets($station);

        return <<<CONF
# ─── TuiStream — Live Streaming Station: {$slug} ──────────────────
# Service Type : Live Streaming
# Stream Key   : {$streamKey}
# RTMP Ingest  : rtmp://SERVER:{$rtmpPort}/live/{$streamKey}
# HLS Play     : http://SERVER:{$httpPort}/hls/{$slug}.m3u8
# DASH Play    : http://SERVER:{$httpPort}/dash/{$slug}.mpd
# ─────────────────────────────────────────────────────────────────

rtmp {
    server {
        listen {$rtmpPort};
        chunk_size 4096;
        timeout 30s;

        application live {
            live on;
            record off;

            # ── HLS Segmentation ──────────────────────────────────
            hls on;
            hls_path {$hls};
            hls_fragment 2s;
            hls_playlist_length 10s;
            hls_cleanup on;
            hls_continuous on;
            hls_fragment_naming system;

            # ── DASH Segmentation ─────────────────────────────────
            dash on;
            dash_path {$dash};
            dash_fragment 2s;
            dash_playlist_length 10s;
            dash_cleanup on;

            # ── Panel Hooks ───────────────────────────────────────
            on_publish      {$this->panelUrl}/api/stream/{$station->id}/on-publish;
            on_publish_done {$this->panelUrl}/api/stream/{$station->id}/on-publish-done;
            on_play         {$this->panelUrl}/api/stream/{$station->id}/on-play;

            # ── Stream Targets (Re-streaming) ─────────────────────
{$pushConf}

            # ── nDVR ──────────────────────────────────────────────
            {$ndvrConf}

            # ── Access ────────────────────────────────────────────
            {$geoipConf}
        }
    }
}

http {
    include      /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;

    server {
        listen {$httpPort};
        server_name _;

        add_header 'Access-Control-Allow-Origin'  '*' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Headers'  'Range' always;

        # ── HLS Delivery ──────────────────────────────────────────
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t                    ts;
            }
            root      /var;
            add_header Cache-Control no-cache;
            add_header X-Accel-Buffering no;
        }

        # ── DASH Delivery ─────────────────────────────────────────
        location /dash {
            types {
                application/dash+xml mpd;
                video/mp2t           ts;
            }
            root      /var;
            add_header Cache-Control no-cache;
        }

        # ── RTMP Stats ────────────────────────────────────────────
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        location /stat.xsl {
            root /etc/nginx/html;
        }

        # ── Control API ───────────────────────────────────────────
        location /control {
            rtmp_control all;
        }
    }
}
CONF;
    }

    /**
     * TV Station — 24/7 loop via FFmpeg → RTMP → NGINX RTMP → HLS
     */
    private function generateTvStation(Station $station): string
    {
        $slug  = $station->slug;
        $hls   = "{$this->hlsBasePath}/tv/{$slug}";
        $dash  = "{$this->dashBasePath}/tv/{$slug}";
        $httpPort = $station->port;
        $rtmpPort = ($station->port + 1000);
        $pushConf = $this->buildPushTargets($station);

        return <<<CONF
# ─── TuiStream — TV Station: {$slug} ─────────────────────────────
# Service Type : TV Station (24/7 Loop)
# RTMP Internal: rtmp://127.0.0.1:{$rtmpPort}/tv/{$slug}
# HLS Play     : http://SERVER:{$httpPort}/hls/tv/{$slug}.m3u8
#
# Start with FFmpeg:
#   ffmpeg -re -i /opt/tuistream/stations/{$slug}/playlist.m3u -c copy \
#     -f flv rtmp://127.0.0.1:{$rtmpPort}/tv/{$slug}
# ─────────────────────────────────────────────────────────────────

rtmp {
    server {
        listen {$rtmpPort};
        chunk_size 4096;

        application tv {
            live on;
            record off;

            hls on;
            hls_path {$hls};
            hls_fragment 2s;
            hls_playlist_length 20s;
            hls_cleanup on;
            hls_continuous on;

            dash on;
            dash_path {$dash};
            dash_fragment 2s;
            dash_playlist_length 20s;
            dash_cleanup on;

            on_publish      {$this->panelUrl}/api/stream/{$station->id}/on-publish;
            on_publish_done {$this->panelUrl}/api/stream/{$station->id}/on-publish-done;

{$pushConf}

            allow publish 127.0.0.1;
            allow play all;
        }
    }
}

http {
    include /etc/nginx/mime.types;
    sendfile on;

    server {
        listen {$httpPort};
        server_name _;

        add_header 'Access-Control-Allow-Origin' '*' always;

        location /hls {
            types { application/vnd.apple.mpegurl m3u8; video/mp2t ts; }
            root /var;
            add_header Cache-Control no-cache;
        }

        location /dash {
            types { application/dash+xml mpd; video/mp2t ts; }
            root /var;
            add_header Cache-Control no-cache;
        }

        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
        location /stat.xsl { root /etc/nginx/html; }
        location /control  { rtmp_control all; }
    }
}
CONF;
    }

    /**
     * Stream Relay — Recibe un stream remoto y lo reenvía a clientes.
     */
    private function generateStreamRelay(Station $station): string
    {
        $slug     = $station->slug;
        $hls      = "{$this->hlsBasePath}/relay/{$slug}";
        $httpPort = $station->port;
        $rtmpPort = ($station->port + 1000);
        $pushConf = $this->buildPushTargets($station);

        return <<<CONF
# ─── TuiStream — Stream Relay: {$slug} ───────────────────────────
# Service Type : Stream Relay
# HLS Play     : http://SERVER:{$httpPort}/hls/relay/{$slug}.m3u8
# ─────────────────────────────────────────────────────────────────

rtmp {
    server {
        listen {$rtmpPort};
        chunk_size 4096;

        application relay {
            live on;
            record off;

            hls on;
            hls_path {$hls};
            hls_fragment 2s;
            hls_playlist_length 10s;
            hls_cleanup on;

{$pushConf}

            allow publish all;
            allow play all;
        }
    }
}

http {
    include /etc/nginx/mime.types;
    sendfile on;

    server {
        listen {$httpPort};
        server_name _;

        add_header 'Access-Control-Allow-Origin' '*' always;

        location /hls {
            types { application/vnd.apple.mpegurl m3u8; video/mp2t ts; }
            root /var;
            add_header Cache-Control no-cache;
        }

        location /stat { rtmp_stat all; rtmp_stat_stylesheet stat.xsl; }
        location /stat.xsl { root /etc/nginx/html; }
        location /control  { rtmp_control all; }
    }
}
CONF;
    }

    /**
     * Genera los bloques push de RTMP para reenvío a plataformas externas.
     * Soporta: Facebook, YouTube, Kick, Twitch, Telegram, Instagram, VK, RTMP genérico, Icecast
     */
    private function buildPushTargets(Station $station): string
    {
        $targets = $station->stream_targets ?? [];

        if (empty($targets)) {
            return '            # No stream targets configured';
        }

        $lines = [];

        foreach ($targets as $target) {
            $rtmp = $this->platformToRtmpUrl(is_array($target) ? $target : ['platform' => $target]);
            if ($rtmp) {
                $lines[] = "            push {$rtmp};";
            }
        }

        return implode("\n", $lines) ?: '            # No valid stream targets';
    }

    /**
     * Convierte nombre de plataforma a URL RTMP de re-streaming.
     */
    private function platformToRtmpUrl(array $target): ?string
    {
        $platform = strtolower($target['platform'] ?? '');
        $key      = $target['stream_key'] ?? '';
        $customUrl = $target['rtmp_url'] ?? $target['url'] ?? '';

        if (!empty($customUrl)) {
            if ($key) {
                if (str_ends_with($customUrl, $key)) {
                    return $customUrl;
                }
                return rtrim($customUrl, '/') . '/' . $key;
            }
            return $customUrl;
        }

        return match ($platform) {
            'youtube'   => $key ? "rtmp://a.rtmp.youtube.com/live2/{$key}" : null,
            'facebook'  => $key ? "rtmps://live-api-s.facebook.com:443/rtmp/{$key}" : null,
            'twitch'    => $key ? "rtmp://live.twitch.tv/app/{$key}" : null,
            'kick'      => $key ? "rtmps://fa723fc1b171.global-contribute.live-video.net:443/app/{$key}" : null,
            'tiktok'    => $key ? "rtmp://push.tiktokv.com/live/{$key}" : null,
            'vk'        => $key ? "rtmp://ovsu.mycdn.me/publish/{$key}" : null,
            'instagram' => $key ? "rtmps://edgetee-upload-sin1-1.xx.fbcdn.net:443/rtmp/{$key}" : null,
            'telegram'  => $key ? "rtmp://dc4-1.rtmp.t.me/s/{$key}" : null,
            'rtmp'      => ($target['url'] ?? '') ? $target['url'] : null,
            'icecast'   => ($target['url'] ?? '') ? $target['url'] : null,
            default     => null,
        };
    }

    /**
     * Genera el includer de configuración nginx para una estación.
     * Se incluye desde el nginx.conf principal via: include /opt/tuistream/stations/[slug]/nginx.conf;
     */
    public function generateInclude(Station $station): string
    {
        $slug = $station->slug;

        return <<<CONF
# Auto-generated by TuiStream — Station: {$slug}
# Include this file from main nginx.conf:
#   include /opt/tuistream/stations/{$slug}/nginx.conf;
{$this->generate($station)}
CONF;
    }
}
