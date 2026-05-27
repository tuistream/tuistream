# Log configurations
set("log.stdout", true)
set("log.level", 3)

# Music source from local media folder mount
music = playlist("/usr/share/liquidsoap/media")

# Fallback sine wave generator in case the playlist is empty
fallback_tone = sine()

# Output combined stream
radio = fallback([music, fallback_tone])

# Stream directly to the Icecast container within the docker network
output.icecast(%mp3,
  host="icecast", port=8000,
  password="hackme", mount="/radio.mp3",
  radio)
