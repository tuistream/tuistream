Te recomiendo usar este prompt como “MASTER PROMPT” para trabajar en [Visual Studio Code](https://code.visualstudio.com?utm_source=chatgpt.com) con [Claude Code](https://www.anthropic.com/claude-code?utm_source=chatgpt.com), [Gemini Code Assist](https://codeassist.google/products/individual?hl=en&utm_source=chatgpt.com) o Cursor.

Este prompt está diseñado para que la IA construya una alternativa moderna tipo MediaCP llamada **TuiStream** con arquitectura SaaS multiusuario y sistema instalable vía SSH/terminal.

```txt
You are a senior full-stack SaaS architect and DevOps engineer.

Your task is to build a production-ready modern streaming hosting platform called:

# TuiStream

TuiStream is a modern alternative to MediaCP, AzuraCast and CentovaCast.

The platform must be designed as a modular SaaS application for streaming audio and video hosting.

====================================================
# CORE STACK
====================================================

Use ONLY this stack:

Backend:
- PHP 8.4+
- Laravel 12+
- Laravel Octane
- Laravel Horizon
- Laravel Reverb
- Laravel Queue
- Laravel Scheduler

Frontend:
- Inertia.js
- React
- TypeScript
- TailwindCSS
- shadcn/ui

Database:
- PostgreSQL

Realtime:
- WebSockets via Laravel Reverb

Cache / Queue:
- Redis

Infrastructure:
- Docker
- Docker Compose

Streaming:
- Icecast
- SHOUTcast
- Liquidsoap
- FFmpeg
- Nginx RTMP

OS Compatibility:
- Ubuntu 24.04 LTS
- Debian 12

====================================================
# APPLICATION ARCHITECTURE
====================================================

The application must be:

- Modular
- Multi-tenant SaaS
- API-first
- Scalable
- Realtime
- VPS compatible
- Self-hosted
- Dockerized

Use clean architecture and service-based architecture.

Structure backend modules:

/Modules
    /Streaming
    /Stations
    /Channels
    /AutoDJ
    /Billing
    /Analytics
    /Monitoring
    /Users
    /Resellers
    /Admin
    /Installer
    /NodeManager
    /SSL
    /Playlists

====================================================
# MULTIUSER SYSTEM
====================================================

The platform must support:

1. Super Admin
2. Resellers
3. Clients
4. Station Managers
5. DJs

Each client must have their own isolated dashboard and resources.

Use tenant isolation.

====================================================
# MAIN FEATURES
====================================================

Implement:

- Audio streaming hosting
- Video streaming hosting
- TV channels
- TV stations
- Radio stations
- AutoDJ
- Playlist management
- Jingles
- Stream scheduling
- SSL management
- Stream monitoring
- Listener analytics
- Live statistics
- Bitrate monitoring
- CPU/RAM monitoring
- Stream restart
- Service restart
- Docker node management
- Billing system
- Subscription plans
- Reseller hosting
- Multi-server management
- API access
- Stream recording
- HLS support
- RTMP ingest
- FFmpeg transcoding

====================================================
# ADMIN PANEL
====================================================

Create a modern admin dashboard inspired by:

- Stripe
- Vercel
- Hetzner Cloud
- Railway

Requirements:

- Dark/light mode
- Responsive
- Modern UI
- Live realtime updates
- Charts
- Server monitoring
- Activity logs
- Global analytics
- Server management
- Billing overview
- Queue monitoring
- Service health monitoring

====================================================
# CLIENT PANEL
====================================================

Each customer dashboard must include:

- Station management
- Stream status
- AutoDJ
- Playlist manager
- Upload music/videos
- Analytics
- SSL
- Restart services
- Live listeners
- Live bitrate
- Storage usage
- Bandwidth usage
- API keys
- DNS settings
- Stream URLs
- Embed player generator

====================================================
# STREAMING ENGINE
====================================================

Use:

Audio:
- Icecast
- SHOUTcast
- Liquidsoap

Video:
- Nginx RTMP
- FFmpeg
- HLS

Do NOT build custom streaming servers.

The platform should orchestrate existing streaming software.

====================================================
# AUTOMATION
====================================================

Implement Linux automation using Laravel jobs and queues.

The system must automatically:

- Create stations
- Generate configs
- Start services
- Restart services
- Provision SSL
- Configure Nginx
- Create Docker containers
- Generate Liquidsoap configs
- Monitor streams
- Detect failures
- Restart failed services

====================================================
# INSTALLER SYSTEM
====================================================

IMPORTANT:

Create a complete SSH/Terminal installer similar to MediaCP.

The platform must install using:

curl install.sh | bash

Create:
- install.sh
- update.sh
- uninstall.sh
- repair.sh

Installer responsibilities:

- Install Docker
- Install Redis
- Install PostgreSQL
- Configure firewall
- Configure Nginx
- Configure SSL
- Configure Supervisor
- Configure queues
- Configure Laravel
- Configure Reverb
- Configure Horizon
- Create admin user
- Configure streaming nodes

Installer must support:
- Fresh VPS install
- Ubuntu 24
- Debian 12

====================================================
# NODE SYSTEM
====================================================

Create a node management system.

Support:

1. Main Panel Server
2. Audio Nodes
3. Video Nodes
4. Transcoding Nodes

Nodes communicate securely with API tokens.

====================================================
# BILLING SYSTEM
====================================================

Implement:

- Stripe subscriptions
- Plan limits
- Resource limits
- Trial accounts
- Invoices
- Usage tracking
- Reseller pricing

====================================================
# SECURITY
====================================================

Implement:

- RBAC permissions
- 2FA
- API tokens
- CSRF protection
- Rate limiting
- Audit logs
- Server authentication
- Secure SSH communication

====================================================
# PERFORMANCE
====================================================

Optimize for:

- High concurrency
- Realtime monitoring
- Low RAM usage
- Queue processing
- Horizontal scaling

====================================================
# DEVELOPER REQUIREMENTS
====================================================

Generate:
- Clean code
- Typed TypeScript
- Reusable components
- REST API
- API documentation
- Docker files
- Seeder data
- Production configs
- Environment examples

====================================================
# UI REQUIREMENTS
====================================================

Use:
- shadcn/ui
- TailwindCSS
- Framer Motion
- Responsive layouts
- Modern cards
- Realtime charts

====================================================
# OUTPUT FORMAT
====================================================

Generate the project step by step.

Start with:

1. Folder architecture
2. Docker architecture
3. Database schema
4. Laravel modules
5. Authentication
6. Multi-tenant system
7. Installer scripts
8. Admin dashboard
9. Client dashboard
10. Streaming provisioning
11. Node communication
12. Billing
13. Monitoring
14. Deployment system

Always generate production-ready code.

Never generate toy examples.

Never simplify architecture.

Think like a real SaaS company building a competitor to MediaCP.
```

Además, te recomiendo usar estas herramientas para desarrollar TuiStream:

* [Laravel](https://laravel.com?utm_source=chatgpt.com)
* [Inertia.js](https://inertiajs.com?utm_source=chatgpt.com)
* [React](https://react.dev?utm_source=chatgpt.com)
* [Tailwind CSS](https://tailwindcss.com?utm_source=chatgpt.com)
* [shadcn/ui](https://ui.shadcn.com?utm_source=chatgpt.com)
* [Docker](https://www.docker.com?utm_source=chatgpt.com)
* [FFmpeg](https://ffmpeg.org?utm_source=chatgpt.com)
* [Icecast](https://icecast.org?utm_source=chatgpt.com)
* [Liquidsoap](https://www.liquidsoap.info?utm_source=chatgpt.com)
* [NGINX RTMP Module](https://github.com/arut/nginx-rtmp-module?utm_source=chatgpt.com)

Y una recomendación importante para que el proyecto sea viable:

## Empieza SOLO con:

* Icecast
* AutoDJ
* estadísticas
* panel SaaS
* multiusuario
* instalador SSH

NO empieces con IPTV y transcoding complejo al inicio.

Haz primero:

# TuiStream Radio Hosting

Luego:

# TuiStream Video

Porque así podrás lanzar más rápido y validar el sistema.
