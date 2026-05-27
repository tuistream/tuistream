# TuiStream — Streaming Hosting Platform

**Modern alternative to MediaCP, AzuraCast & CentovaCast**
by [Hostuis Group LLC](https://hostuis.com)

---

## 🚀 Quick Install via SSH

```bash
curl -L https://recursos.tuistream.com/install.bin > install.bin && chmod +x install.bin
./install.bin start
```

> **NOTE:** After installation is completed, login to your Admin Panel and insert your License Key.

---

## 📋 System Requirements

### CPU
- Minimum **1 Core CPU** (2+ recommended for transcoding)

### Memory
- Minimum **2 GB RAM** (4+ GB recommended)

### Storage
- HDD / NVMe / SSD — as per your streaming needs

### Supported Operating Systems
| OS | Version |
|---|---|
| AlmaLinux | 9, 10 |
| Ubuntu | 22.04 LTS, 24.04 LTS |
| Debian | 11 (Bullseye), 12 (Bookworm) |

---

## 🔥 Network & Firewall

The following ports must be available on your VPS/Dedicated Server:

| Port | Protocol | Purpose |
|---|---|---|
| `22` | TCP | SSH Access |
| `21` | TCP | FTP |
| `80` | TCP | HTTP / Let's Encrypt ACME |
| `443` | TCP | HTTPS |
| `2020` | TCP | TuiStream Admin Panel (HTTPS) |
| `1935` | TCP | Global RTMP Ingest |
| `999–65000` | TCP | Streaming Services Range |

---

## 📦 What Gets Installed

### Video Streaming (Native — No Docker)
- **NGINX** compiled from source with the official **nginx-rtmp-module**
- **FFmpeg** for transcoding and TV Station loops
- **HLS** (HTTP Live Streaming) delivery at `/var/hls`
- **DASH** (Dynamic Adaptive Streaming) delivery at `/var/dash`

### Audio Streaming (Docker-isolated)
- **Icecast KH** — MP3, AAC, OGG
- **SHOUTcast 2** — MP3, AAC with SSL
- **Liquidsoap** — AutoDJ engine

### Platform Stack
- **PHP 8.4** with FPM
- **PostgreSQL 17** — main database
- **Redis 7** — cache, sessions, queues
- **Supervisor** — process management
- **Node.js 22** — frontend build

---

## ⚙️ Management Commands

After installation, use the `tuistream` command from anywhere:

```bash
tuistream start          # Start all services
tuistream stop           # Stop workers
tuistream restart        # Restart all services
tuistream status         # Show system status
tuistream update         # Update TuiStream
tuistream nginx-test     # Test NGINX config
tuistream nginx-reload   # Reload NGINX without downtime
tuistream logs horizon   # View Horizon logs
tuistream artisan ...    # Run any artisan command
```

---

## 🔄 How to Upgrade

```bash
tuistream update
```

Or manually:
```bash
curl -L https://recursos.tuistream.com/install.bin > install.bin && chmod +x install.bin
./install.bin update
```

---

## 🗑️ How to Uninstall

```bash
curl -L https://recursos.tuistream.com/install.bin > install.bin && chmod +x install.bin
./install.bin uninstall
```

> ⚠️ This action is **irreversible** and will delete all stations, data, and configurations.

---

## 📡 Video Streaming — NGINX RTMP

TuiStream installs **Free NGINX Video Server** with the official **nginx-rtmp-module**, providing:

- **RTMP** ingest from OBS, FFmpeg, any encoder
- **HLS** playback (`.m3u8`) — compatible with all players
- **DASH** playback (`.mpd`) — adaptive bitrate
- **Live Streaming** — real-time broadcast
- **Stream Relay** — relay/proxy external streams
- **TV Station** — 24/7 playlist loop via FFmpeg

### Stream URLs per Station
```
RTMP Ingest : rtmp://<SERVER_IP>:<RTMP_PORT>/live/<stream-key>
HLS Play    : http://<SERVER_IP>:<PORT>/hls/live/<stream-key>.m3u8
DASH Play   : http://<SERVER_IP>:<PORT>/dash/live/<stream-key>.mpd
Stats       : http://<SERVER_IP>:<PORT>/stat
```

### Re-streaming Targets
| Platform | Supported |
|---|---|
| YouTube | ✅ |
| Facebook | ✅ |
| Twitch | ✅ |
| Kick | ✅ |
| TikTok | ✅ |
| Instagram | ✅ |
| Telegram | ✅ |
| VK | ✅ |
| Custom RTMP | ✅ |
| Icecast | ✅ |

---

## 🔐 Admin Panel Access

After installation:

```
URL:      https://<YOUR-SERVER-IP>:2020
Email:    admin@tuistream.local
Password: (shown at end of installation)
```

---

## 🏢 About

**TuiStream** is developed and maintained by **[Hostuis Group LLC](https://hostuis.com)**

© 2026 TuiStream. Todos los derechos reservados. por Hostuis Group LLC.
