#===============================================================================
# TuiStream — Instalador para Windows (PowerShell)
#===============================================================================
# Requisitos previos:
#   - Docker Desktop instalado y corriendo (https://www.docker.com/products/docker-desktop/)
#   - Git instalado (https://git-scm.com/download/win)
#
# Uso como Administrador en PowerShell:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   .\install.ps1
#===============================================================================

param(
    [string]$Domain = "",
    [string]$Email = ""
)

$ErrorActionPreference = "Stop"

$APP_NAME = "TuiStream"
$APP_SLUG = "tuistream"
$APP_DIR = "C:\$APP_SLUG"
$GITHUB_REPO = "tuistream/tuistream"

# ── Colores ─────────────────────────────────────────────────────────────────
function Write-Info  { Write-Host "  [✓] $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "  [!] $args" -ForegroundColor Yellow }
function Write-Error2 { Write-Host "  [✗] $args" -ForegroundColor Red }
function Write-Step  { Write-Host ""; Write-Host "▶ $args" -ForegroundColor Cyan }
function Write-Cmd   { Write-Host "    → $args" -ForegroundColor Blue }

# ── Banner ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║     TuiStream — Streaming Profesional de Radio y TV           ║" -ForegroundColor Blue
Write-Host "║     Instalador para Windows (Docker Desktop) v1.0             ║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ── Verificar Docker ──────────────────────────────────────────────────────
Write-Step "Verificando Docker Desktop..."
try {
    docker info | Out-Null
    Write-Info "Docker Desktop está corriendo"
} catch {
    Write-Error2 "Docker Desktop no está corriendo. Instálalo desde: https://www.docker.com/products/docker-desktop/"
    exit 1
}

# ── Verificar Git ──────────────────────────────────────────────────────
try {
    git --version | Out-Null
    Write-Info "Git está instalado"
} catch {
    Write-Error2 "Git no encontrado. Instálalo desde: https://git-scm.com/download/win"
    exit 1
}

# ── Pedir dominio si no se pasó como parámetro ──────────────────────────
if (-not $Domain) {
    $Domain = Read-Host "  Ingresa tu dominio (ej: radio.midominio.com)"
}
if (-not $Email) {
    $Email = Read-Host "  Email para certificados SSL"
}
Write-Info "Dominio: $Domain"
Write-Info "Email SSL: $Email"

# ── Clonar / Copiar código ───────────────────────────────────────────────
Write-Step "Descargando código de TuiStream..."
if (Test-Path $APP_DIR) {
    Write-Warn "Directorio $APP_DIR ya existe. Haciendo backup..."
    Move-Item $APP_DIR "$APP_DIR.bak.$(Get-Date -Format 'yyyyMMddHHmmss')" -Force
}

# Si ya estamos en el directorio del proyecto
if ((Test-Path "composer.json") -and (Test-Path "docker")) {
    Write-Info "Usando código local del directorio actual"
    Copy-Item -Path .\* -Destination $APP_DIR -Recurse -Force
} else {
    Write-Cmd "Clonando desde GitHub..."
    git clone "https://github.com/$GITHUB_REPO.git" $APP_DIR --depth 1
}

Set-Location $APP_DIR

# ── Generar .env ──────────────────────────────────────────────────────────
Write-Step "Generando configuración (.env)..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -Force
}

# Crear .env.docker
@"
DOMAIN=$Domain
EMAIL=$Email
DB_PASS=$( -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | % {[char]$_}) )
REDIS_PASS=$( -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 12 | % {[char]$_}) )
STREAM_PASS=$( -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 8 | % {[char]$_}) )
"@ | Out-File -FilePath ".env.docker" -Encoding utf8 -Force

Write-Info ".env y .env.docker generados"

# ── Construir y desplegar contenedores ────────────────────────────────────
Write-Step "Construyendo y desplegando servicios Docker..."
Write-Cmd "Esto puede tardar varios minutos..."

docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d

Write-Info "Contenedores desplegados"

# ── Post-instalación ──────────────────────────────────────────────────────
Write-Step "Ejecutando migraciones y configuración final..."
Write-Cmd "Esperando a que PostgreSQL esté listo..."
Start-Sleep -Seconds 10

docker exec tuistream_app php artisan key:generate --force
docker exec tuistream_app php artisan migrate --force
docker exec tuistream_app php artisan storage:link 2>$null

Write-Info "Migraciones ejecutadas"

# ── Resumen ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  ✅ ¡INSTALACIÓN COMPLETADA CON ÉXITO!" -ForegroundColor Green
Write-Host ""
Write-Host "  Ahora accede a tu panel:" -ForegroundColor White
Write-Host "  https://$Domain/setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Crea tu cuenta de administrador principal en esa página." -ForegroundColor White
Write-Host ""
Write-Host "  Servicios disponibles:" -ForegroundColor White
Write-Host "  • Panel Admin:  https://$Domain" -ForegroundColor Cyan
Write-Host "  • Icecast 2 KH: http://$Domain" -f 8100 -ForegroundColor Cyan
Write-Host "  • SHOUTcast 2:  http://$Domain:8005" -ForegroundColor Cyan
Write-Host "  • RTMP Ingest:  rtmp://$Domain:1935/live" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
