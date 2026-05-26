<?php

namespace Modules\Streaming\Services;

use Modules\Stations\Models\Station;

class NginxRtmpConfigGenerator
{
    /**
     * Generar la configuración de Nginx con el módulo RTMP y segmentación HLS para una emisora de video.
     *
     * @param Station $station
     * @param string $streamKey Clave de transmisión RTMP para la emisora (ej: live).
     * @return string
     */
    public function generate(Station $station, string $streamKey = 'live'): string
    {
        $slug = $station->slug;

        return <<<CONF
worker_processes auto;
rtmp_auto_push on;
events {}

rtmp {
    server {
        # Puerto RTMP interno en el contenedor
        listen 1935;
        chunk_size 4000;

        application live {
            live on;
            record off;

            # Habilitar empaquetamiento HLS a partir de la señal RTMP
            hls on;
            hls_path /var/hls;
            hls_fragment 3; # fragmentos de 3 segundos
            hls_playlist_length 60; # playlist mantiene 60 segundos
            
            # Limpiar fragmentos viejos
            hls_cleanup on;
        }
    }
}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;

    server {
        # Puerto HTTP interno para servir el HLS y monitoreo
        listen 8000;

        # Habilitar cabeceras CORS para permitir reproducción en reproductores JS externos
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Expose-Headers Content-Length,Content-Range;
        add_header Access-Control-Allow-Headers Range;

        # Endpoint para reproducir el stream HLS (.m3u8)
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var;
            add_header Cache-Control no-cache;
        }

        # Página de monitoreo de Nginx RTMP
        location /stat {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }

        location /stat.xsl {
            root /usr/share/nginx/html;
        }
    }
}
CONF;
    }
}
