# Configuración Liquidsoap para la estación: Radio Fiesta Latino (radio-fiesta)
# Generado automáticamente por TuiStream

# Ajustar nivel de logs
set("log.level", 3)
set("log.file.path", "/usr/share/liquidsoap/logs/liquidsoap.log")

# Configurar entrada de Harbor para DJs en vivo (Prioridad 1)
# Esto permite transiciones suaves cuando el DJ se conecta
live_dj = input.harbor(
    "live",
    port = 9010,
    password = "dj_pass_c7050036",
    buffer = 2.0,
    max = 10.0
)

# Configurar fuente de la Playlist de AutoDJ (Prioridad 2)
# Liquidsoap lee recursivamente la carpeta de medios
autodj_playlist = playlist(
    id = "autodj_playlist",
    mode = "randomize",
    reload_mode = "watch",
    "/usr/share/liquidsoap/media"
)

# Configurar audio de respaldo en caso de emergencia (Prioridad 3)
emergency_fallback = single(
    id = "emergency_fallback",
    "/usr/share/liquidsoap/fallback.mp3"
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

# Enviar flujo de audio hacia el servidor Icecast local (dentro de la red Docker)
# Se conecta a "icecast" en el puerto 8000 del contenedor Icecast de la emisora.
output.icecast(
    %mp3(bitrate=192),
    host = "icecast",
    port = 8000,
    password = "source_pass_cee0a102",
    mount = "/radio.mp3",
    name = "Radio Fiesta Latino - TuiStream",
    description = "Transmitido por TuiStream",
    url = "http://radio-fiesta.tuistream.com",
    genre = "Mix",
    radio
)