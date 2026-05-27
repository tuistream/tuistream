#!/usr/bin/env bash
#===============================================================================
# TuiStream — Instalador Automático (1 solo comando SSH)
#===============================================================================
# Compatible: Ubuntu 20.04+, Debian 11+, CentOS 8+ / Rocky 8+, Fedora 36+
# Uso:
#   curl -sSL https://raw.githubusercontent.com/tuistream/tuistream/main/install.sh | sudo bash
# O local:
#   sudo bash install.sh
#===============================================================================
set -euo pipefail

APP_NAME="TuiStream"
APP_SLUG="tuistream"
APP_DIR="/opt/${APP_SLUG}"
DOMAIN=""
EMAIL=""
GITHUB_REPO="tuistream/tuistream"

# ── Colores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║     ████████╗ ██╗   ██╗ ██╗ ███████╗ ████████╗ ██████╗       ║"
    echo "║     ╚══██╔══╝ ██║   ██║ ██║ ██╔════╝ ╚══██╔══╝ ██╔══██╗     ║"
    echo "║        ██║    ██║   ██║ ██║ ███████╗    ██║    ██████╔╝     ║"
    echo "║        ██║    ██║   ██║ ██║ ╚════██║    ██║    ██╔══██╗     ║"
    echo "║        ██║    ╚██████╔╝ ██║ ███████║    ██║    ██║  ██║     ║"
    echo "║        ╚═╝     ╚═════╝  ╚═╝ ╚══════╝    ╚═╝    ╚═╝  ╚═╝     ║"
    echo "║                                                               ║"
    echo "║       Streaming Profesional de Radio y TV por Internet        ║"
    echo "║               Instalación Automática v1.0                     ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

info()  { echo -e "  ${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "  ${YELLOW}[!]${NC} $1"; }
error() { echo -e "  ${RED}[✗]${NC} $1"; exit 1; }
step()  { echo -e "\n${BOLD}${CYAN}▶ $1${NC}"; }
cmdout() { echo -e "    ${BLUE}→${NC} $1"; }

# ── Verificar root ───────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    error "Este instalador debe ejecutarse como root (sudo)."
fi

# ── Banner ────────────────────────────────────────────────────────────────────
banner

# ── Pedir dominio y email ────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Configuración del servidor${NC}"
echo "  ─────────────────────────────────────────"
if [[ -z "$DOMAIN" ]]; then
    read -p "  Ingresa tu dominio (ej: radio.midominio.com): " DOMAIN
fi
if [[ -z "$EMAIL" ]]; then
    read -p "  Email para certificados SSL (Let's Encrypt): " EMAIL
fi
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    error "Dominio y email son obligatorios para SSL automático."
fi
echo ""
info "Dominio: ${DOMAIN}"
info "Email SSL: ${EMAIL}"

# ── Paso 1: Detectar SO ─────────────────────────────────────────────────────
step "Paso 1/8: Detectando sistema operativo..."
OS=""
PKG_MANAGER=""
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS="${ID}"
    case "${ID}" in
        ubuntu|debian)           PKG_MANAGER="apt" ;;
        centos|rhel|rocky|alma)  PKG_MANAGER="yum" ;;
        fedora)                  PKG_MANAGER="dnf" ;;
        *) warn "SO no reconocido: ${ID}. Intentando con apt..."; PKG_MANAGER="apt" ;;
    esac
else
    warn "No se pudo detectar el SO. Asumiendo Ubuntu/Debian."
    OS="ubuntu"; PKG_MANAGER="apt"
fi
info "Sistema detectado: ${OS} (${PKG_MANAGER})"

# ── Paso 2: Actualizar paquetes ──────────────────────────────────────────────
step "Paso 2/8: Actualizando sistema e instalando dependencias..."
case "$PKG_MANAGER" in
    apt)
        export DEBIAN_FRONTEND=noninteractive
        apt update -qq && apt upgrade -y -qq
        apt install -y -qq curl wget git ca-certificates gnupg lsb-release ufw
        ;;
    yum)
        yum update -y -q
        yum install -y -q curl wget git ca-certificates gnupg redhat-lsb-core
        ;;
    dnf)
        dnf update -y -q
        dnf install -y -q curl wget git ca-certificates gnupg
        ;;
esac
info "Dependencias base instaladas"

# ── Paso 3: Instalar Docker + Docker Compose ─────────────────────────────────
step "Paso 3/8: Instalando Docker Engine y Docker Compose..."
if command -v docker &>/dev/null && docker info &>/dev/null; then
    info "Docker ya está instalado y funcionando"
else
    case "$PKG_MANAGER" in
        apt)
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/${OS}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${OS} $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
            apt update -qq && apt install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        yum)
            yum-config-manager --add-repo https://download.docker.com/linux/${OS}/docker-ce.repo
            yum install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        dnf)
            dnf config-manager --add-repo https://download.docker.com/linux/${OS}/docker-ce.repo
            dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
    esac
    systemctl enable docker --now
    info "Docker instalado correctamente"
fi

# ── Paso 4: Firewall ─────────────────────────────────────────────────────────
step "Paso 4/8: Configurando firewall (UFW)..."
if command -v ufw &>/dev/null; then
    ufw --force reset &>/dev/null || true
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp   comment 'SSH'
    ufw allow 80/tcp   comment 'HTTP'
    ufw allow 443/tcp  comment 'HTTPS'
    ufw allow 1935/tcp comment 'RTMP'
    ufw --force enable
    info "Firewall configurado (22, 80, 443, 1935)"
else
    warn "UFW no disponible. Abre manualmente los puertos 80, 443 y 1935."
fi

# ── Paso 5: Clonar repositorio ───────────────────────────────────────────────
step "Paso 5/8: Descargando TuiStream..."
if [[ -d "$APP_DIR" ]]; then
    warn "Directorio ${APP_DIR} ya existe. Haciendo backup..."
    mv "$APP_DIR" "${APP_DIR}.bak.$(date +%s)" || true
fi

if [[ -f "./composer.json" ]] && [[ -d "./docker" ]]; then
    info "Usando código local (ya estamos en el directorio del proyecto)"
    mkdir -p "$APP_DIR"
    rsync -a ./ "$APP_DIR/" --exclude='.git' --exclude='node_modules' --exclude='vendor' 2>/dev/null || cp -r ./* "$APP_DIR/" 2>/dev/null || true
else
    cmdout "Clonando desde GitHub..."
    git clone --depth 1 "https://github.com/${GITHUB_REPO}.git" "$APP_DIR" 2>/dev/null || {
        warn "GitHub no accesible, usando código local si existe"
        mkdir -p "$APP_DIR"
    }
fi

cd "$APP_DIR"
info "Código descargado en ${APP_DIR}"

# ── Paso 6: Configurar .env ─────────────────────────────────────────────────
step "Paso 6/8: Generando configuración..."
DB_PASS=$(openssl rand -hex 16)
APP_KEY_BASE=$(openssl rand -hex 32)
REDIS_PASS=$(openssl rand -hex 12)
STREAM_PASS=$(openssl rand -hex 8)
ADMIN_PASS_HASH='$2y$12$PLACEHOLDER_REPLACE_DURING_BUILD'

cat > .env <<ENVEOF
APP_NAME="${APP_NAME}"
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_URL=https://${DOMAIN}

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=${APP_SLUG}
DB_USERNAME=${APP_SLUG}
DB_PASSWORD=${DB_PASS}

REDIS_HOST=redis
REDIS_PASSWORD=${REDIS_PASS}
REDIS_PORT=6379

BROADCAST_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

FILESYSTEM_DISK=local

MAIL_MAILER=log
MAIL_FROM_ADDRESS="no-reply@${DOMAIN}"

VITE_APP_NAME="${APP_NAME}"
ENVEOF

# Crear .env.docker con las variables para docker-compose
cat > .env.docker <<ENVEOF
DOMAIN=${DOMAIN}
EMAIL=${EMAIL}
DB_PASS=${DB_PASS}
REDIS_PASS=${REDIS_PASS}
STREAM_PASS=${STREAM_PASS}
ENVEOF

info "Archivos .env generados"

# ── Paso 7: Construir y desplegar contenedores ────────────────────────────────
step "Paso 7/8: Construyendo y desplegando servicios Docker..."
cmdout "Esto puede tardar varios minutos..."

docker compose -f docker-compose.prod.yml build --pull 2>&1 | while read line; do
    echo "    $line"
done

docker compose -f docker-compose.prod.yml up -d 2>&1 | while read line; do
    echo "    $line"
done

info "Contenedores desplegados"

# ── Paso 8: Post-instalación (migraciones, app key, storage) ──────────────────
step "Paso 8/8: Configuración final..."

# Esperar a que PostgreSQL esté listo
cmdout "Esperando a que PostgreSQL esté listo..."
for i in $(seq 1 30); do
    if docker exec tuistream_postgres pg_isready -U ${APP_SLUG} &>/dev/null; then
        info "PostgreSQL listo"
        break
    fi
    sleep 2
done

# Generar APP_KEY y ejecutar migraciones
cmdout "Generando APP_KEY y ejecutando migraciones..."
docker exec tuistream_app php artisan key:generate --force
docker exec tuistream_app php artisan migrate --force
docker exec tuistream_app php artisan storage:link 2>/dev/null || true

# Configurar permisos
docker exec tuistream_app chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Crear link simbólico para CLI
ln -sf "${APP_DIR}/tuistream" /usr/local/bin/tuistream 2>/dev/null || true

info "Configuración final completada"

# ── Verificación de salud ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}   VERIFICACIÓN DE SERVICIOS${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

SERVICES=(
    "tuistream_app:Panel Web:https://${DOMAIN}:1"
    "tuistream_postgres:PostgreSQL 17:localhost:5432"
    "tuistream_redis:Redis 7:localhost:6379"
    "tuistream_nginx_rtmp:Nginx-RTMP + HLS:rtmp://${DOMAIN}:1935"
    "tuistream_icecast:Icecast 2 KH:http://${DOMAIN}:8100"
    "tuistream_shoutcast:SHOUTcast 2:http://${DOMAIN}:8005"
    "tuistream_liquidsoap:Liquidsoap AutoDJ:localhost:8015"
    "tuistream_nginx_proxy:Nginx Proxy + SSL:https://${DOMAIN}:0"
)

ALL_OK=true
for svc in "${SERVICES[@]}"; do
    IFS=':' read -r cname name conn <<< "$svc"
    if docker ps --format '{{.Names}}' | grep -q "^${cname}$"; then
        if docker inspect "${cname}" --format='{{.State.Running}}' | grep -q true; then
            echo -e "  ${GREEN}[✓]${NC} ${name} ${BLUE}→${NC} ${conn}"
        else
            echo -e "  ${RED}[✗]${NC} ${name} ${BLUE}→${NC} DETENIDO"
            ALL_OK=false
        fi
    else
        echo -e "  ${RED}[✗]${NC} ${name} ${BLUE}→${NC} NO ENCONTRADO"
        ALL_OK=false
    fi
done

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if $ALL_OK; then
    echo -e "  ${GREEN}${BOLD}✅ ¡INSTALACIÓN COMPLETADA CON ÉXITO!${NC}"
    echo ""
    echo -e "  ${BOLD}Ahora accede a tu panel:${NC}"
    echo -e "  ${CYAN}https://${DOMAIN}/setup${NC}"
    echo ""
    echo -e "  ${BOLD}Crea tu cuenta de administrador principal en esa página.${NC}"
    echo -e "  ${BOLD}El asistente te guiará en 3 pasos.${NC}"
    echo ""
    echo -e "  ${BOLD}Servicios disponibles:${NC}"
    echo -e "  • Panel Admin:  ${CYAN}https://${DOMAIN}${NC}"
    echo -e "  • Icecast 2 KH: ${CYAN}http://${DOMAIN}:8100${NC}"
    echo -e "  • SHOUTcast 2:  ${CYAN}http://${DOMAIN}:8005${NC}"
    echo -e "  • RTMP Ingest:  ${CYAN}rtmp://${DOMAIN}:1935/live${NC}"
    echo -e "  • HLS Output:   ${CYAN}https://${DOMAIN}/hls/live.m3u8${NC}"
    echo ""
    echo -e "  ${BOLD}Comandos útiles:${NC}"
    echo -e "  • Ver logs:      ${BLUE}docker compose -f ${APP_DIR}/docker-compose.prod.yml logs -f${NC}"
    echo -e "  • Reiniciar:     ${BLUE}docker compose -f ${APP_DIR}/docker-compose.prod.yml restart${NC}"
    echo -e "  • Detener:       ${BLUE}docker compose -f ${APP_DIR}/docker-compose.prod.yml down${NC}"
else
    echo -e "  ${RED}${BOLD}⚠ ALGUNOS SERVICIOS NO ESTÁN CORRIENDO${NC}"
    echo -e "  Revisa los logs: ${BLUE}docker compose -f ${APP_DIR}/docker-compose.prod.yml logs${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}TuiStream — Streaming Profesional de Radio y TV${NC}"
echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
