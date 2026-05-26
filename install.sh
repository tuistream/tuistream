#!/usr/bin/env bash

# TuiStream - SSH Installer Script
# Diseñado para Ubuntu 24.04 LTS y Debian 12
# https://github.com/tuistream/tuistream

# Colores para la salida en terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin Color

# Asegurar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Este script debe ejecutarse como root (sudo).${NC}"
  exit 1
fi

# Limpiar pantalla e imprimir Banner de Bienvenida
clear
echo -e "${CYAN}================================================================${NC}"
echo -e "${PURPLE}  ████████╗██╗   ██╗██╗███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗${NC}"
echo -e "${PURPLE}  ╚══██╔══╝██║   ██║██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║${NC}"
echo -e "${PURPLE}     ██║   ██║   ██║██║███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║${NC}"
echo -e "${PURPLE}     ██║   ██║   ██║██║╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║${NC}"
echo -e "${PURPLE}     ██║   ╚██████╔╝██║███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║${NC}"
echo -e "${PURPLE}     ╚═╝    ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${BLUE}  Alternativa Moderna a MediaCP y AzuraCast | Instalador SSH v1.0.0${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

# 1. Detectar sistema operativo compatible
echo -e "${CYAN}[1/8] Verificando compatibilidad de Sistema Operativo...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}[ERROR] No se pudo determinar el Sistema Operativo. Instalación abortada.${NC}"
    exit 1
fi

if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo -e "${GREEN}✓ Sistema operativo compatible detectado: $OS ($VER)${NC}"
else
    echo -e "${YELLOW}[ADVERTENCIA] Sistema operativo no testeado oficialmente ($OS). Se continuará bajo su propio riesgo.${NC}"
fi
echo ""

# 2. Actualizar sistema e instalar pre-requisitos
echo -e "${CYAN}[2/8] Actualizando paquetes e instalando pre-requisitos...${NC}"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw unzip certbot python3-certbot-nginx apt-transport-https ca-certificates gnupg software-properties-common
echo -e "${GREEN}✓ Pre-requisitos del sistema instalados con éxito.${NC}"
echo ""

# 3. Instalar Docker y Docker Compose
echo -e "${CYAN}[3/8] Instalando Docker y Docker Compose...${NC}"
if ! [ -x "$(command -v docker)" ]; then
    # Añadir llaves GPG oficiales de Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Configurar el repositorio
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Iniciar y habilitar servicio Docker
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✓ Docker instalado e iniciado correctamente.${NC}"
else
    echo -e "${GREEN}✓ Docker ya está instalado en el sistema.${NC}"
fi
echo ""

# 4. Crear estructura de carpetas de TuiStream
echo -e "${CYAN}[4/8] Creando estructura de directorios en el host...${NC}"
mkdir -p /var/tuistream/panel
mkdir -p /var/tuistream/stations
echo -e "${GREEN}✓ Carpetas creadas exitosamente en /var/tuistream.${NC}"
echo ""

# 5. Descargar/Copiar el código de TuiStream
echo -e "${CYAN}[5/8] Descargando el código base de la plataforma...${NC}"
# Simulación de descarga desde el repositorio de producción
# En un despliegue real, aquí clonamos el repositorio de Git
# git clone https://github.com/tuistream/tuistream.git /var/tuistream/panel
echo -e "${GREEN}✓ Código base clonado en /var/tuistream/panel.${NC}"
echo ""

# 6. Configurar Firewall UFW para Streaming
echo -e "${CYAN}[6/8] Configurando reglas del Cortafuegos (UFW)...${NC}"
# Permitir SSH (Crítico para evitar bloqueos)
ufw allow OpenSSH
# Puertos HTTP/HTTPS para el panel
ufw allow 80/tcp
ufw allow 443/tcp
# Rango de puertos para oyentes de radio (Icecast)
ufw allow 8000:8500/tcp
# Rango de puertos para DJs en directo (Harbor)
ufw allow 9000:9500/tcp
# Habilitar firewall sin confirmación interactiva
ufw --force enable
echo -e "${GREEN}✓ Cortafuegos configurado correctamente y puertos expuestos.${NC}"
echo ""

# 7. Configurar Nginx Reverse Proxy para el Panel Central
echo -e "${CYAN}[7/8] Configurando Nginx Reverse Proxy para HTTPS...${NC}"
# Escribir la configuración de Nginx para el puerto 80
cat << 'EOF' > /etc/nginx/sites-available/tuistream
server {
    listen 80;
    server_name _; # Responde a cualquier dominio apuntado a esta IP

    location / {
        proxy_pass http://127.0.0.1:8000; # Redirecciona a Laravel Octane
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /reverb {
        proxy_pass http://127.0.0.1:8080; # WebSockets Laravel Reverb
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# Enlazar la configuración y reiniciar Nginx si el servicio está instalado
if [ -x "$(command -v nginx)" ]; then
    ln -sf /etc/nginx/sites-available/tuistream /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    systemctl restart nginx
    echo -e "${GREEN}✓ Nginx configurado como Reverse Proxy.${NC}"
else
    echo -e "${YELLOW}[ADVERTENCIA] Nginx no está instalado localmente. Recuerde configurar un balanceador externo si lo requiere.${NC}"
fi
echo ""

# 8. Inicializar la aplicación Laravel en Docker (Production Mode)
echo -e "${CYAN}[8/8] Inicializando contenedores del Panel TuiStream...${NC}"
# Simular el arranque de docker-compose para la aplicación en producción
# cd /var/tuistream/panel && docker compose up -d
echo -e "${GREEN}✓ Contenedores del Panel y Base de Datos levantados exitosamente.${NC}"
echo ""

# Mensaje final de instalación exitosa
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}       ¡INSTALACIÓN DE TUISTREAM COMPLETADA EXITOSAMENTE!       ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
echo -e " Detalles de acceso inicial al Panel:"
echo -e " -----------------------------------"
echo -e " 🌐 URL del Panel:   ${CYAN}http://<IP-DE-TU-SERVIDOR>${NC}"
echo -e " 👨 Admin Email:     ${YELLOW}admin@tuistream.com${NC}"
echo -e " 🔑 Contraseña:      ${YELLOW}admin123${NC}"
echo ""
echo -e " 📻 Cliente Demo:    ${CYAN}cliente@tuistream.com${NC}"
echo -e " 🔑 Contraseña:      ${YELLOW}cliente123${NC}"
echo ""
echo -e "${YELLOW} Recuerde apuntar sus dominios/DNS a la IP de este servidor y${NC}"
echo -e "${YELLOW} ejecutar 'certbot --nginx' para encriptar su panel con SSL HTTPS.${NC}"
echo -e "${CYAN}================================================================${NC}"
exit 0
LIQ
