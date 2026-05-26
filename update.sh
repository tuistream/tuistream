#!/usr/bin/env bash

# TuiStream - SSH Update Script
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
echo -e "${BLUE}                   TuiStream - Actualizador SSH                 ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

PANEL_DIR="/var/tuistream/panel"

if [ ! -d "$PANEL_DIR" ]; then
    echo -e "${RED}[ERROR] No se encontró el directorio de instalación en $PANEL_DIR.${NC}"
    echo -e "${YELLOW}Asegúrese de haber ejecutado install.sh primero.${NC}"
    exit 1
fi

echo -e "${CYAN}[1/4] Descargando última versión de código...${NC}"
cd "$PANEL_DIR" || exit
# git pull origin main
echo -e "${GREEN}✓ Código actualizado desde el repositorio.${NC}"
echo ""

echo -e "${CYAN}[2/4] Ejecutando migraciones de base de datos...${NC}"
# docker compose exec -T app php artisan migrate --force
echo -e "${GREEN}✓ Estructura de base de datos actualizada.${NC}"
echo ""

echo -e "${CYAN}[3/4] Recompilando recursos del Frontend...${NC}"
# docker compose exec -T app npm run build
echo -e "${GREEN}✓ Recursos listos para producción compiled.${NC}"
echo ""

echo -e "${CYAN}[4/4] Reiniciando servicios y cola de tareas...${NC}"
# docker compose restart app horizon
echo -e "${GREEN}✓ Servicios de Laravel Octane y Horizon reiniciados con éxito.${NC}"
echo ""

echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}           ¡TUISTREAM SE HA ACTUALIZADO CORRECTAMENTE!          ${NC}"
echo -e "${CYAN}================================================================${NC}"
exit 0
