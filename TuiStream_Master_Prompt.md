# TuiStream - Streaming Control Panel

## Descripción General

TuiStream es una plataforma profesional de Streaming Audio y Video inspirada en MediaCP, diseñada para ser instalada en VPS o servidores dedicados Linux.

El sistema NO es SaaS.

El sistema NO tendrá facturación.

El sistema NO tendrá licencias.

El sistema NO tendrá revendedores (Resellers).

El propietario del sistema será el único administrador global.

Los clientes NO pueden crear emisoras ni canales.

Los clientes solamente administran los recursos que el administrador les asigne.

La experiencia visual debe ser moderna tipo aplicación móvil (Mobile App UI), utilizando Laravel + Inertia + Vue.

---

# Stack Tecnológico

Backend:

* Laravel 13+
* PHP 8.4+
* Laravel Horizon
* Laravel Queues
* Laravel Scheduler

Frontend:

* Vue 3
* Inertia.js
* TypeScript
* TailwindCSS
* Pinia

Base de Datos:

* MySQL 8

Cache:

* Redis

Web Server:

* Nginx

Streaming Audio:

* Icecast 2
* Liquidsoap
* FFmpeg

Streaming Video:

* Nginx RTMP
* HLS
* DASH
* FFmpeg

Realtime:

* Laravel Reverb
* WebSockets

Servidor:

* AlmaLinux 9
* Rocky Linux 9
* Ubuntu 24.04

---

# Instalador Automático SSH

Crear un comando:

curl -sSL install.tuistream.sh | bash

o

wget -O - https://install.tuistream.sh | bash

El instalador deberá:

Actualizar sistema operativo.

Instalar:

* PHP
* Composer
* NodeJS LTS
* MySQL
* Redis
* Nginx
* FFmpeg
* Icecast
* Liquidsoap

Configurar automáticamente:

* Firewall
* SELinux
* Permisos
* Servicios systemd

Abrir puertos:

22 SSH

80 HTTP

443 HTTPS

8000 Icecast

8001 Icecast SSL

1935 RTMP

8080 HLS

8081 DASH

6001 WebSockets

3306 MySQL localhost

6379 Redis localhost

Generar automáticamente:

* SSL Let's Encrypt
* Virtual Host
* Configuración Nginx
* Configuración Redis
* Configuración Queue Workers

---

# Roles

## Administrador

Acceso completo.

Puede:

* Crear clientes
* Editar clientes
* Suspender clientes
* Eliminar clientes

Puede crear:

* Emisoras
* Canales de TV
* Web TV
* Streaming Video
* Streaming Audio

Puede asignar recursos:

* Espacio disco
* Oyentes
* Bitrate
* AutoDJ
* Canales

Puede monitorear:

* CPU
* RAM
* Disco
* Tráfico
* Estado Streaming

---

## Cliente

No puede crear recursos.

Solamente administra recursos asignados.

Puede:

* Cambiar contraseña
* Editar perfil
* Subir canciones
* Crear playlists
* Programar playlists
* Iniciar transmisión en vivo
* Ver estadísticas
* Ver estado del servidor
* Administrar AutoDJ

No puede:

* Crear emisoras
* Crear canales
* Crear usuarios
* Crear servidores

---

# Audio Streaming

Compatible con:

* Icecast
* MP3
* AAC
* OGG

Funciones:

* AutoDJ
* Playlists
* Jingles
* Programación horaria
* Metadata
* DJ Accounts
* Estadísticas oyentes
* Geo estadísticas
* Historial canciones

---

# TV Station

Compatible:

* RTMP
* HLS
* DASH

Tipos:

* Canal TV 24/7
* Web TV
* Radio Visual
* Live Events

Funciones:

* Programación de videos
* Programación automática
* Biblioteca multimedia
* Streaming continuo
* Repeticiones automáticas

---

# Biblioteca Multimedia

Audio:

* mp3
* aac
* wav
* ogg

Video:

* mp4
* mov
* mkv
* webm

Funciones:

* Upload masivo
* Drag & Drop
* Carpetas
* Búsqueda
* Etiquetas
* Miniaturas

---

# Dashboard Administrador

Widgets:

* Streaming activos
* Streaming caídos
* Clientes activos
* Oyentes online
* Canales online
* Consumo CPU
* Consumo RAM
* Consumo Disco
* Tráfico diario

---

# Dashboard Cliente

Widgets:

* Estado transmisión
* Oyentes online
* Estado AutoDJ
* Últimas canciones
* Estado canal TV
* Consumo espacio

---

# Seguridad

* CSRF
* XSS Protection
* Rate Limiting
* 2FA
* Logs auditoría
* Login Activity
* Session Management

---

# API Interna

Laravel API REST.

Endpoints para:

* Clientes
* Emisoras
* Canales
* AutoDJ
* Estadísticas
* Biblioteca multimedia

---

# Diseño UI

Inspiración:

* MediaCP
* Spotify
* YouTube Studio
* Vimeo OTT

Características:

* Mobile First
* Responsive
* Dark Mode
* Light Mode
* Dashboard moderno
* Componentes reutilizables
* Navegación lateral

---

# Estructura Proyecto

/app

/resources/js

/resources/views

/routes

/database

/storage

/modules

/streaming

/install

/scripts

/docs

---

# Objetivo Final

Construir una alternativa moderna a MediaCP para uso privado del administrador.

Sin SaaS.

Sin licencias.

Sin reseller.

Con Audio Streaming.

Con AutoDJ.

Con Video Streaming.

Con TV Station.

Con instalación automática vía SSH.

Optimizado para VPS y servidores dedicados.
