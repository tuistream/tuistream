#!/usr/bin/env bash
# TuiStream - Uninstaller (alias de install.bin uninstall)
# Uso: bash uninstall.sh
set -euo pipefail

INSTALL_BIN_URL="https://recursos.tuistream.com/install.bin"

if [ "$EUID" -ne 0 ]; then
    echo "[ERROR] Ejecutar como root: sudo bash uninstall.sh"
    exit 1
fi

if [ -f "./install.bin" ]; then
    bash ./install.bin uninstall
elif [ -f "/opt/tuistream/install.bin" ]; then
    bash /opt/tuistream/install.bin uninstall
else
    echo "Descargando instalador..."
    curl -fsSL "$INSTALL_BIN_URL" -o /tmp/install.bin && chmod +x /tmp/install.bin
    bash /tmp/install.bin uninstall
fi
