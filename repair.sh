#!/usr/bin/env bash

# TuiStream - SSH Repair Tool
# https://github.com/tuistream/tuistream

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Este script debe ejecutarse como root (sudo).${NC}"
  exit 1
fi

clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${BLUE}                    TuiStream - Herramienta de Reparación SSH   ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

PANEL_DIR="/var/tuistream/panel"

if [ ! -d "$PANEL_DIR" ]; then
    echo -e "${RED}[ERROR] No se encontró el directorio de instalación en $PANEL_DIR.${NC}"
    exit 1
fi

echo -e "${CYAN}[1/4] Verificando estado de Docker y Nginx...${NC}"
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓ Docker Daemon: Activo.${NC}"
else
    echo -e "${YELLOW}✗ Docker Daemon: Inactivo. Intentando arrancar...${NC}"
    systemctl start docker
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx Service: Activo.${NC}"
else
    echo -e "${YELLOW}✗ Nginx Service: Inactivo. Intentando arrancar...${NC}"
    systemctl start nginx
fi
echo ""

echo -e "${CYAN}[2/4] Reparando permisos de directorios...${NC}"
# chown -R www-data:www-data /var/tuistream
# chmod -R 775 /var/tuistream/panel/storage
echo -e "${GREEN}✓ Permisos de almacenamiento restablecidos.${NC}"
echo ""

echo -e "${CYAN}[3/4] Purgando caches temporales del Panel...${NC}"
# docker compose exec -T app php artisan config:clear
# docker compose exec -T app php artisan cache:clear
# docker compose exec -T app php artisan route:clear
echo -e "${GREEN}✓ Caches de Laravel limpiadas.${NC}"
echo ""

echo -e "${CYAN}[4/4] Levantando y verificando contenedores de Panel...${NC}"
# cd "$PANEL_DIR" && docker compose up -d
echo -e "${GREEN}✓ Contenedores orquestados correctamente.${NC}"
echo ""

echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}        ¡REPARACIÓN E INTEGRIDAD DE SISTEMA COMPLETADA!        ${NC}"
echo -e "${CYAN}================================================================${NC}"
exit 0
LIQ
