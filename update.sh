#!/usr/bin/env bash
# TuiStream - Updater (alias de install.bin update)
# Uso: tuistream update  ó  bash update.sh
set -euo pipefail

INSTALL_BIN_URL="https://recursos.tuistream.com/install.bin"

if [ "$EUID" -ne 0 ]; then
    echo "[ERROR] Ejecutar como root: sudo bash update.sh"
    exit 1
fi

if [ -f "./install.bin" ]; then
    bash ./install.bin update
elif [ -f "/opt/tuistream/install.bin" ]; then
    bash /opt/tuistream/install.bin update
else
    echo "Descargando instalador..."
    curl -fsSL "$INSTALL_BIN_URL" -o /tmp/install.bin && chmod +x /tmp/install.bin
    bash /tmp/install.bin update
fi
