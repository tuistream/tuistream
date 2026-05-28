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

        // PERFIL 1: VIDEO (Nginx RTMP nativo — instalado por install.bin)
        // Las estaciones de video NO usan Docker. NGINX RTMP corre nativamente en el host.
        // El instalador compila NGINX con el módulo RTMP desde fuentes.
        // Cada estación recibe su propia configuración en /opt/tuistream/stations/{slug}/nginx.conf
        // que se incluye desde el nginx.conf principal.
        //
        // Para gestionar la estación de video usar NginxRtmpConfigGenerator::generateInclude()
        // y recargar nginx: nginx -s reload
        if ($station->type === 'video') {
            return <<<YAML
services:
  nginx-rtmp:
    image: tiangolo/nginx-rtmp:latest
    container_name: tuistream_station_{$slug}_nginx_rtmp
    restart: unless-stopped
    ports:
      - "{$port}:80"
      - "9011:1935"
      - "{$djPort}:1935"
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
services:
  shoutcast:
    image: khartool/shoutcast-x64:2.6.1.777-3.19.1
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
services:
  icecast:
    image: libretime/icecast:2.5.0
    container_name: tuistream_station_{$slug}_icecast
    restart: unless-stopped
    ports:
      - "{$port}:8000"
    volumes:
      - ./config/icecast.xml:/etc/icecast.xml:ro
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
