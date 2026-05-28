<?php

namespace Modules\AutoDJ\Services;

use Modules\Stations\Models\Station;
use App\Models\Setting;

class LiquidsoapConfigGenerator
{
    /**
     * Generar el script de configuración de Liquidsoap (.liq) para una emisora.
     *
     * @param Station $station
     * @param string $icecastSourcePassword Contraseña para la conexión fuente de Icecast.
     * @param string $djPassword Contraseña para que los DJs se conecten en vivo.
     * @return string
     */
    public function generate(Station $station, string $icecastSourcePassword, string $djPassword, string $icecastHost = 'icecast'): string
    {
        $slug = $station->slug;
        $bitrate = $station->bitrate;
        $domain = Setting::get('server_domain', request()->getHost());

        $escSourcePass = $this->escapeLiqString($icecastSourcePassword);
        $escDjPass     = $this->escapeLiqString($djPassword);
        $escName       = $this->escapeLiqString($station->name);
        $escHost       = $this->escapeLiqString($icecastHost);
        $escDomain     = $this->escapeLiqString($domain);

        // Rutas internas de los contenedores Docker
        $mediaPath = "/usr/share/liquidsoap/media";
        $fallbackFile = "/usr/share/liquidsoap/fallback.mp3";
        $djPort = $station->port + 1000;

        // Determinar si la salida es para Icecast o SHOUTcast
        if ($station->frontend === 'shoutcast') {
            $outputDirective = <<<LIQ
# Enviar flujo de audio hacia el servidor SHOUTcast local
output.shoutcast(
    %mp3(bitrate={$bitrate}),
    host = "{$escHost}",
    port = 8000,
    password = "{$escSourcePass}",
    name = "{$escName} - TuiStream",
    url = "https://{$escDomain}",
    genre = "Mix",
    radio
)
LIQ;
        } else {
            $outputDirective = <<<LIQ
# Enviar flujo de audio hacia el servidor Icecast local (dentro de la red Docker)
output.icecast(
    %mp3(bitrate={$bitrate}),
    host = "{$escHost}",
    port = 8000,
    password = "{$escSourcePass}",
    mount = "/radio.mp3",
    name = "{$escName} - TuiStream",
    description = "Transmitido por TuiStream",
    url = "https://{$escDomain}",
    genre = "Mix",
    radio
)
LIQ;
        }

        return <<<LIQ
# Configuración Liquidsoap para la estación: {$escName} ({$slug})
# Generado automáticamente por TuiStream

# Ajustar nivel de logs
set("log.level", 3)
set("log.file.path", "/usr/share/liquidsoap/logs/liquidsoap.log")

# Configurar entrada de Harbor para DJs en vivo (Prioridad 1)
# Esto permite transiciones suaves cuando el DJ se conecta
live_dj = input.harbor(
    "live",
    port = {$djPort},
    password = "{$escDjPass}",
    buffer = 2.0,
    max = 10.0
)

# Configurar fuente de la Playlist de AutoDJ (Prioridad 2)
# Liquidsoap lee recursivamente la carpeta de medios
autodj_playlist = playlist(
    id = "autodj_playlist",
    mode = "randomize",
    reload_mode = "watch",
    "{$mediaPath}"
)

# Configurar audio de respaldo en caso de emergencia (Prioridad 3)
emergency_fallback = single(
    id = "emergency_fallback",
    "{$fallbackFile}"
)

# Priorización y mezcla de las fuentes
# 1. Si el DJ está transmitiendo, pasa a él.
# 2. Si no, reproduce la playlist del AutoDJ.
# 3. Si falla la playlist, reproduce el archivo de emergencia.
radio = fallback(
    track_sensitive = false,
    [
        live_dj,
        autodj_playlist,
        emergency_fallback
    ]
)

# Aplicar transiciones suaves (fade-in y fade-out) de 1.5 segundos
radio = crossfade(fade_in=1.5, fade_out=1.5, radio)

{$outputDirective}
LIQ;
    }

    private function escapeLiqString(string $value): string
    {
        return str_replace(
            ['\\', '"', "\$"],
            ['\\\\', '\\"', '\\$'],
            $value
        );
    }
}
