<?php

namespace Modules\Streaming\Services;

use Modules\Stations\Models\Station;

class DockerComposeGenerator
{
    /**
     * Generar el contenido del archivo docker-compose.yml para una emisora.
     * Soporta perfiles de 'audio' (Icecast/SHOUTcast) y 'video' (Nginx RTMP/HLS).
     *
     * @param Station $station
     * @return string
     */
    public function generate(Station $station): string
    {
        $slug = $station->slug;
        $port = $station->port;
        $djPort = $port + 1000;

        // PERFIL 1: VIDEO (Nginx RTMP + FFmpeg + HLS)
        if ($station->type === 'video') {
            return <<<YAML
version: '3.8'

services:
  nginx_rtmp:
    image: tiangolo/nginx-rtmp:latest
    container_name: tuistream_station_{$slug}_video
    restart: unless-stopped
    ports:
      - "{$port}:8000"   # Puerto HTTP para reproducir HLS (.m3u8) y ver estadísticas
      - "{$djPort}:1935" # Puerto RTMP para recibir transmisión de OBS (ej: rtmp://ip:{$djPort}/live)
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./hls:/var/hls
      - ./logs/nginx:/var/log/nginx
    networks:
      - station_net

networks:
  station_net:
    driver: bridge
YAML;
        }

        // PERFIL 2: AUDIO SHOUTcast
        if ($station->frontend === 'shoutcast') {
            return <<<YAML
version: '3.8'

services:
  shoutcast:
    image: mabene/shoutcast:latest
    container_name: tuistream_station_{$slug}_shoutcast
    restart: unless-stopped
    ports:
      - "{$port}:8000"
    volumes:
      - ./config/sc_serv.conf:/opt/shoutcast/sc_serv.conf:ro
      - ./logs/shoutcast:/opt/shoutcast/logs
    networks:
      - station_net

  liquidsoap:
    image: savonet/liquidsoap:v2.2.5
    container_name: tuistream_station_{$slug}_liquidsoap
    restart: unless-stopped
    ports:
      - "{$djPort}:{$djPort}"
    volumes:
      - ./config/liquidsoap.liq:/etc/liquidsoap/script.liq:ro
      - ./media:/usr/share/liquidsoap/media
      - ./logs/liquidsoap:/usr/share/liquidsoap/logs
      - ./config/fallback.mp3:/usr/share/liquidsoap/fallback.mp3:ro
    depends_on:
      - shoutcast
    networks:
      - station_net

networks:
  station_net:
    driver: bridge
YAML;
        }

        // PERFIL 3: AUDIO Icecast (Default)
        return <<<YAML
version: '3.8'

services:
  icecast:
    image: infiniteproject/icecast2:latest
    container_name: tuistream_station_{$slug}_icecast
    restart: unless-stopped
    ports:
      - "{$port}:8000"
    volumes:
      - ./config/icecast.xml:/etc/icecast2/icecast.xml:ro
      - ./logs/icecast:/var/log/icecast
    networks:
      - station_net

  liquidsoap:
    image: savonet/liquidsoap:v2.2.5
    container_name: tuistream_station_{$slug}_liquidsoap
    restart: unless-stopped
    ports:
      - "{$djPort}:{$djPort}"
    volumes:
      - ./config/liquidsoap.liq:/etc/liquidsoap/script.liq:ro
      - ./media:/usr/share/liquidsoap/media
      - ./logs/liquidsoap:/usr/share/liquidsoap/logs
      - ./config/fallback.mp3:/usr/share/liquidsoap/fallback.mp3:ro
    depends_on:
      - icecast
    networks:
      - station_net

networks:
  station_net:
    driver: bridge
YAML;
    }
}
