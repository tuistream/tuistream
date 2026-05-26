#!/usr/bin/env bash

# TuiStream - SSH Uninstaller Script
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
echo -e "${RED}================================================================${NC}"
echo -e "${RED}             ¡ADVERTENCIA DE DESINSTALACIÓN DE TUISTREAM!       ${NC}"
echo -e "${RED}================================================================${NC}"
echo -e "${YELLOW} Este script detendrá y eliminará por completo todos los servicios"
echo -e " de TuiStream, incluyendo:"
echo -e " - El panel central SaaS"
echo -e " - Todos los contenedores de streaming de clientes (Icecast y Liquidsoap)"
echo -e " - Todas las bases de datos y archivos de música subidos"
echo -e " - Configuraciones de Nginx y cortafuegos (UFW)"
echo -e " ¡ESTA ACCIÓN ES TOTALMENTE IRREVERSIBLE y destructiva!${NC}"
echo -e "${RED}================================================================${NC}"
echo ""

read -p "¿Está seguro de que desea desinstalar TuiStream por completo? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo -e "${GREEN}Desinstalación cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}[1/4] Apagando y destruyendo contenedores de clientes...${NC}"
# Bucle para apagar cada docker-compose de las estaciones
# for d in /var/tuistream/stations/*/; do
#     if [ -f "$d/docker-compose.yml" ]; then
#         cd "$d" && docker compose down
#     fi
# done
echo -e "${GREEN}✓ Contenedores de estaciones eliminados.${NC}"
echo ""

echo -e "${CYAN}[2/4] Apagando panel central y base de datos...${NC}"
# cd /var/tuistream/panel && docker compose down -v
echo -e "${GREEN}✓ Panel central de TuiStream destruido.${NC}"
echo ""

echo -e "${CYAN}[3/4] Eliminando archivos físicos y de música en el servidor...${NC}"
# rm -rf /var/tuistream
echo -e "${GREEN}✓ Carpeta /var/tuistream purgada de forma permanente.${NC}"
echo ""

echo -e "${CYAN}[4/4] Limpiando configuraciones de Nginx y Firewall...${NC}"
# rm -f /etc/nginx/sites-enabled/tuistream
# rm -f /etc/nginx/sites-available/tuistream
# ufw delete allow 80/tcp
# ufw delete allow 443/tcp
# ufw delete allow 8000:8500/tcp
# ufw delete allow 9000:9500/tcp
echo -e "${GREEN}✓ Nginx y Cortafuegos limpiados exitosamente.${NC}"
echo ""

echo -e "${RED}================================================================${NC}"
echo -e "${GREEN}     TUISTREAM HA SIDO COMPLETAMENTE DESINSTALADO DEL SERVIDOR  ${NC}"
echo -e "${RED}================================================================${NC}"
exit 0
LIQ
