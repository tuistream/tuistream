#!/bin/bash
#
# TuiStream - Automatic Installer
# Compatible with: AlmaLinux 9, Rocky Linux 9, Ubuntu 24.04
#
# Usage:
#   # From official install script
#   curl -sSL https://install.tuistream.sh | bash
#   
#   # From your own subdomain
#   curl -sSL https://instalar.hostuis.com/install.sh | bash
#   
#   # From GitHub with custom repository
#   REPO_URL="https://github.com/tu-usuario/tuistream.git" bash <(curl -sSL https://install.tuistream.sh)
#   
#   # With all environment variables
#   DOMAIN=tuistream.example.com REPO_URL=https://github.com/myorg/tuistream.git bash <(curl -sSL https://install.tuistream.sh)
#

set -e

# ──────────────────────────────────────
# Color definitions
# ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# ──────────────────────────────────────
# Configuration
# ──────────────────────────────────────
APP_NAME="TuiStream"
APP_VERSION="1.0.0"
INSTALL_DIR="${INSTALL_DIR:-/var/www/tuistream}"
PHP_VERSION="${PHP_VERSION:-8.4}"
NODE_VERSION="${NODE_VERSION:-22}"
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24)
MYSQL_DB="${MYSQL_DB:-tuistream}"
MYSQL_USER="${MYSQL_USER:-tuistream}"
MYSQL_PASSWORD=$(openssl rand -base64 24)
DOMAIN="${DOMAIN:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

# Repository configuration
REPO_URL="${REPO_URL:-https://github.com/hostuis/tuistream.git}"
REPO_BRANCH="${REPO_BRANCH:-main}"
INSTALL_METHOD="${INSTALL_METHOD:-}"  # github, tarball, or manual

# ──────────────────────────────────────
# Helper functions
# ──────────────────────────────────────
log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_section() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}\n"; }

banner() {
    clear
    echo -e "${BLUE}${BOLD}"
    echo "╔══════════════════════════════════════╗"
    echo "║         TuiStream Installer          ║"
    echo "║         Streaming Control Panel       ║"
    echo "║              v${APP_VERSION}                   ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
}

# ──────────────────────────────────────
# OS Detection
# ──────────────────────────────────────
detect_os() {
    log_section "Detecting Operating System"

    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        log_info "Detected: $NAME $VERSION_ID"
    else
        log_error "Cannot detect OS. Aborting."
        exit 1
    fi

    case $OS in
        almalinux|rocky|rhel)
            OS_FAMILY="rhel"
            ;;
        ubuntu)
            OS_FAMILY="debian"
            ;;
        *)
            log_error "Unsupported OS: $OS. Supported: AlmaLinux 9, Rocky Linux 9, Ubuntu 24.04"
            exit 1
            ;;
    esac
}

# ──────────────────────────────────────
# Collect user input
# ──────────────────────────────────────
collect_info() {
    log_section "Configuration"

    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain (e.g., tuistream.example.com): " DOMAIN
    fi

    if [ -z "$ADMIN_EMAIL" ]; then
        read -p "Enter admin email for SSL certificate: " ADMIN_EMAIL
    fi

    # Repository method selection
    if [ -z "$INSTALL_METHOD" ]; then
        echo ""
        echo "How do you want to install TuiStream?"
        echo "  1) Clone from GitHub repository"
        echo "  2) Download tarball from URL"
        echo "  3) Manual installation (files already in place)"
        echo ""
        read -p "Select installation method (1-3): " METHOD_CHOICE
        
        case $METHOD_CHOICE in
            1) INSTALL_METHOD="github" ;;
            2) INSTALL_METHOD="tarball" ;;
            3) INSTALL_METHOD="manual" ;;
            *) 
                log_error "Invalid choice. Defaulting to GitHub."
                INSTALL_METHOD="github"
                ;;
        esac
    fi

    # Repository URL for GitHub method
    if [ "$INSTALL_METHOD" = "github" ] && [ "$REPO_URL" = "https://github.com/hostuis/tuistream.git" ]; then
        echo ""
        read -p "Enter GitHub repository URL [${REPO_URL}]: " CUSTOM_REPO
        if [ ! -z "$CUSTOM_REPO" ]; then
            REPO_URL="$CUSTOM_REPO"
        fi
    fi

    # Tarball URL
    if [ "$INSTALL_METHOD" = "tarball" ]; then
        echo ""
        read -p "Enter tarball URL or leave blank for GitHub release: " TARBALL_URL
        if [ -z "$TARBALL_URL" ]; then
            TARBALL_URL="https://github.com/hostuis/tuistream/archive/refs/heads/${REPO_BRANCH}.tar.gz"
        fi
    fi

    echo ""
    log_info "Domain: ${BOLD}$DOMAIN${NC}"
    log_info "Admin Email: ${BOLD}$ADMIN_EMAIL${NC}"
    log_info "Install Directory: ${BOLD}$INSTALL_DIR${NC}"
    log_info "Installation Method: ${BOLD}$INSTALL_METHOD${NC}"
    if [ "$INSTALL_METHOD" = "github" ]; then
        log_info "Repository: ${BOLD}$REPO_URL${NC}"
        log_info "Branch: ${BOLD}$REPO_BRANCH${NC}"
    elif [ "$INSTALL_METHOD" = "tarball" ]; then
        log_info "Tarball URL: ${BOLD}$TARBALL_URL${NC}"
    fi
    echo ""
    read -p "Continue with installation? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        log_error "Installation cancelled."
        exit 0
    fi
}

# ──────────────────────────────────────
# System Update
# ──────────────────────────────────────
system_update() {
    log_section "Updating System"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf update -y
        dnf install -y epel-release
        dnf config-manager --set-enabled crb 2>/dev/null || true
    else
        apt-get update -y
        apt-get upgrade -y
    fi

    log_info "System updated successfully"
}

# ──────────────────────────────────────
# Install PHP
# ──────────────────────────────────────
install_php() {
    log_section "Installing PHP ${PHP_VERSION}"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
        dnf install -y https://rpms.remirepo.net/enterprise/remi-release-9.rpm
        dnf module reset php -y
        dnf module enable php:remi-${PHP_VERSION} -y
        dnf install -y \
            php \
            php-cli \
            php-fpm \
            php-mysqlnd \
            php-pgsql \
            php-redis \
            php-xml \
            php-mbstring \
            php-curl \
            php-zip \
            php-gd \
            php-bcmath \
            php-intl \
            php-opcache \
            php-json \
            php-process
    else
        apt-get install -y software-properties-common
        add-apt-repository -y ppa:ondrej/php
        apt-get update -y
        apt-get install -y \
            php${PHP_VERSION} \
            php${PHP_VERSION}-cli \
            php${PHP_VERSION}-fpm \
            php${PHP_VERSION}-mysql \
            php${PHP_VERSION}-redis \
            php${PHP_VERSION}-xml \
            php${PHP_VERSION}-mbstring \
            php${PHP_VERSION}-curl \
            php${PHP_VERSION}-zip \
            php${PHP_VERSION}-gd \
            php${PHP_VERSION}-bcmath \
            php${PHP_VERSION}-intl \
            php${PHP_VERSION}-opcache
    fi

    # Configure PHP
    PHP_INI="/etc/php/${PHP_VERSION}/fpm/php.ini"
    if [ "$OS_FAMILY" = "rhel" ]; then
        PHP_INI="/etc/php.ini"
    fi

    sed -i 's/memory_limit = .*/memory_limit = 512M/' $PHP_INI
    sed -i 's/max_execution_time = .*/max_execution_time = 300/' $PHP_INI
    sed -i 's/upload_max_filesize = .*/upload_max_filesize = 512M/' $PHP_INI
    sed -i 's/post_max_size = .*/post_max_size = 512M/' $PHP_INI

    systemctl enable php-fpm
    systemctl restart php-fpm

    log_info "PHP ${PHP_VERSION} installed successfully"
}

# ──────────────────────────────────────
# Install Composer
# ──────────────────────────────────────
install_composer() {
    log_section "Installing Composer"

    EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

    if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
        log_error "Composer installer checksum mismatch. Aborting."
        rm composer-setup.php
        exit 1
    fi

    php composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm composer-setup.php

    log_info "Composer installed successfully"
}

# ──────────────────────────────────────
# Install Node.js
# ──────────────────────────────────────
install_nodejs() {
    log_section "Installing Node.js LTS"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf module enable nodejs:${NODE_VERSION} -y
        dnf install -y nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs
    fi

    log_info "Node.js $(node -v) installed successfully"
}

# ──────────────────────────────────────
# Install Git
# ──────────────────────────────────────
install_git() {
    log_section "Installing Git"

    if command -v git &> /dev/null; then
        log_info "Git is already installed: $(git --version)"
        return
    fi

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y git
    else
        apt-get install -y git
    fi

    log_info "Git installed successfully: $(git --version)"
}

# ──────────────────────────────────────
# Install/Clone Application Repository
# ──────────────────────────────────────
clone_repository() {
    log_section "Installing TuiStream Application"

    mkdir -p $INSTALL_DIR

    case $INSTALL_METHOD in
        github)
            install_git
            log_info "Cloning from: $REPO_URL"
            
            if [ -d "$INSTALL_DIR/.git" ]; then
                log_warn "Repository already exists. Pulling latest changes..."
                cd $INSTALL_DIR
                git pull origin $REPO_BRANCH
            else
                git clone -b $REPO_BRANCH $REPO_URL $INSTALL_DIR
            fi
            ;;
            
        tarball)
            log_info "Downloading tarball: $TARBALL_URL"
            
            TEMP_DIR=$(mktemp -d)
            cd $TEMP_DIR
            
            if command -v wget &> /dev/null; then
                wget -q $TARBALL_URL -O tarball.tar.gz
            else
                curl -sSL $TARBALL_URL -o tarball.tar.gz
            fi
            
            tar -xzf tarball.tar.gz --strip-components=1 -C $INSTALL_DIR
            rm -rf $TEMP_DIR
            ;;
            
        manual)
            log_info "Manual installation mode"
            if [ ! -f "$INSTALL_DIR/composer.json" ]; then
                log_error "No application files found at $INSTALL_DIR"
                log_error "Please place TuiStream files in $INSTALL_DIR and run again."
                exit 1
            fi
            ;;
    esac

    log_info "Application files ready at $INSTALL_DIR"
}

# ──────────────────────────────────────
# Install MySQL
# ──────────────────────────────────────
install_mysql() {
    log_section "Installing MySQL 8"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y mysql-server
    else
        apt-get install -y mysql-server
    fi

    systemctl enable mysqld
    systemctl start mysqld

    # Secure MySQL and create database
    mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DB}.* TO '${MYSQL_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

    log_info "MySQL 8 installed and configured"
    log_info "Database: ${MYSQL_DB} / User: ${MYSQL_USER}"
}

# ──────────────────────────────────────
# Install Redis
# ──────────────────────────────────────
install_redis() {
    log_section "Installing Redis"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y redis
    else
        apt-get install -y redis-server
    fi

    # Configure Redis for caching
    sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    sed -i 's/^maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf

    systemctl enable redis
    systemctl restart redis

    log_info "Redis installed successfully"
}

# ──────────────────────────────────────
# Install Nginx
# ──────────────────────────────────────
install_nginx() {
    log_section "Installing Nginx"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y nginx
    else
        apt-get install -y nginx
    fi

    systemctl enable nginx
    log_info "Nginx installed successfully"
}

# ──────────────────────────────────────
# Install FFmpeg
# ──────────────────────────────────────
install_ffmpeg() {
    log_section "Installing FFmpeg"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-9.noarch.rpm
        dnf install -y ffmpeg ffmpeg-devel
    else
        apt-get install -y ffmpeg
    fi

    log_info "FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}') installed"
}

# ──────────────────────────────────────
# Install Icecast 2
# ──────────────────────────────────────
install_icecast() {
    log_section "Installing Icecast 2"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y icecast
    else
        apt-get install -y icecast2
    fi

    # Configure Icecast
    ICECAST_SOURCE_PASS=$(openssl rand -base64 16)
    ICECAST_ADMIN_PASS=$(openssl rand -base64 16)
    ICECAST_RELAY_PASS=$(openssl rand -base64 16)

    cat > /etc/icecast.xml <<ICECASTCONF
<icecast>
    <limits>
        <clients>1000</clients>
        <sources>50</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
    </limits>
    <authentication>
        <source-password>${ICECAST_SOURCE_PASS}</source-password>
        <admin-password>${ICECAST_ADMIN_PASS}</admin-password>
        <relay-password>${ICECAST_RELAY_PASS}</relay-password>
    </authentication>
    <directory>
        <yp-url-timeout>15</yp-url-timeout>
        <yp-url>http://dir.xiph.org/cgi-bin/yp-cgi</yp-url>
    </directory>
    <listen-socket>
        <port>8000</port>
    </listen-socket>
    <listen-socket>
        <port>8001</port>
        <ssl>1</ssl>
    </listen-socket>
    <paths>
        <logdir>/var/log/icecast</logdir>
        <webroot>/usr/share/icecast/web</webroot>
        <adminroot>/usr/share/icecast/admin</adminroot>
    </paths>
    <logging>
        <accesslog>access.log</accesslog>
        <errorlog>error.log</errorlog>
        <loglevel>3</loglevel>
    </logging>
</icecast>
ICECASTCONF

    systemctl enable icecast
    systemctl restart icecast

    log_info "Icecast 2 installed and configured"
}

# ──────────────────────────────────────
# Install Liquidsoap
# ──────────────────────────────────────
install_liquidsoap() {
    log_section "Installing Liquidsoap"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y liquidsoap
    else
        apt-get install -y liquidsoap
    fi

    # Create config directory
    mkdir -p /etc/liquidsoap/tuistream
    mkdir -p /var/log/tuistream

    log_info "Liquidsoap installed successfully"
}

# ──────────────────────────────────────
# Configure Firewall
# ──────────────────────────────────────
configure_firewall() {
    log_section "Configuring Firewall"

    if [ "$OS_FAMILY" = "rhel" ]; then
        systemctl enable firewalld
        systemctl start firewalld

        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --permanent --add-port=8000/tcp    # Icecast
        firewall-cmd --permanent --add-port=8001/tcp    # Icecast SSL
        firewall-cmd --permanent --add-port=1935/tcp    # RTMP
        firewall-cmd --permanent --add-port=8080/tcp    # HLS
        firewall-cmd --permanent --add-port=8081/tcp    # DASH
        firewall-cmd --permanent --add-port=6001/tcp    # WebSockets (Reverb)
        firewall-cmd --reload
    else
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 8000/tcp
        ufw allow 8001/tcp
        ufw allow 1935/tcp
        ufw allow 8080/tcp
        ufw allow 8081/tcp
        ufw allow 6001/tcp
        ufw --force enable
    fi

    log_info "Firewall configured"
}

# ──────────────────────────────────────
# Configure SELinux (RHEL only)
# ──────────────────────────────────────
configure_selinux() {
    if [ "$OS_FAMILY" != "rhel" ]; then
        return
    fi

    log_section "Configuring SELinux"

    setsebool -P httpd_can_network_connect 1
    setsebool -P httpd_can_network_connect_db 1
    setsebool -P httpd_can_sendmail 1

    # Allow Nginx to connect to Redis and Reverb
    semanage port -a -t http_port_t -p tcp 6001 2>/dev/null || true

    log_info "SELinux configured"
}

# ──────────────────────────────────────
# Clone and setup application
# ──────────────────────────────────────
setup_application() {
    log_section "Configuring TuiStream Application"

    cd $INSTALL_DIR

    # Set permissions
    chown -R nginx:nginx $INSTALL_DIR
    chmod -R 755 $INSTALL_DIR
    chmod -R 775 $INSTALL_DIR/storage
    chmod -R 775 $INSTALL_DIR/bootstrap/cache

    # Install PHP dependencies
    log_info "Installing Composer dependencies..."
    sudo -u nginx composer install --no-dev --optimize-autoloader

    # Setup .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            log_warn ".env.example not found. Creating basic .env"
            touch .env
        fi
    fi
    
    php artisan key:generate

    # Update .env with configuration
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=${MYSQL_DB}|" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=${MYSQL_USER}|" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${MYSQL_PASSWORD}|" .env
    sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}|" .env
    sed -i "s|ICECAST_SOURCE_PASSWORD=.*|ICECAST_SOURCE_PASSWORD=${ICECAST_SOURCE_PASS}|" .env
    sed -i "s|ICECAST_ADMIN_PASSWORD=.*|ICECAST_ADMIN_PASSWORD=${ICECAST_ADMIN_PASS}|" .env
    sed -i "s|ICECAST_RELAY_PASSWORD=.*|ICECAST_RELAY_PASSWORD=${ICECAST_RELAY_PASS}|" .env
    sed -i "s|REVERB_HOST=.*|REVERB_HOST=${DOMAIN}|" .env

    # Run migrations and seed
    php artisan migrate --force
    php artisan db:seed --force

    # Install Node dependencies and build
    log_info "Installing Node.js dependencies..."
    npm ci
    npm run build

    # Setup storage link
    php artisan storage:link

    # Cache configuration
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    log_info "Application setup complete"
}

# ──────────────────────────────────────
# Configure Nginx Virtual Host
# ──────────────────────────────────────
configure_nginx_vhost() {
    log_section "Configuring Nginx Virtual Host"

    cat > /etc/nginx/conf.d/tuistream.conf <<'NGINXCONF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    root INSTALL_DIR_PLACEHOLDER/public;
    index index.php;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # API rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /api/ {
        limit_req zone=api burst=10 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /login {
        limit_req zone=login burst=3 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location /app/ {
        deny all;
    }

    location /horizon {
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Reverb WebSocket proxy
    location /apps/ {
        proxy_pass http://127.0.0.1:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400;
    }
}
NGINXCONF

    # Replace placeholders
    sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" /etc/nginx/conf.d/tuistream.conf
    sed -i "s|INSTALL_DIR_PLACEHOLDER|${INSTALL_DIR}|g" /etc/nginx/conf.d/tuistream.conf

    # Create password for Horizon
    HORIZON_PASS=$(openssl rand -base64 12)
    htpasswd -bc /etc/nginx/.htpasswd admin $HORIZON_PASS

    nginx -t && systemctl restart nginx

    log_info "Nginx configured successfully"
    log_info "Horizon admin user: admin / password: ${HORIZON_PASS}"
}

# ──────────────────────────────────────
# SSL Certificate (Let's Encrypt)
# ──────────────────────────────────────
setup_ssl() {
    log_section "Setting up SSL Certificate"

    if [ "$OS_FAMILY" = "rhel" ]; then
        dnf install -y certbot python3-certbot-nginx
    else
        apt-get install -y certbot python3-certbot-nginx
    fi

    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ${ADMIN_EMAIL}

    log_info "SSL certificate installed"
}

# ──────────────────────────────────────
# Configure Queue Workers
# ──────────────────────────────────────
configure_queue_workers() {
    log_section "Configuring Queue Workers (Horizon)"

    cat > /etc/systemd/system/tuistream-horizon.service <<SYSTEMD
[Unit]
Description=TuiStream Horizon Queue Worker
After=network.target redis.service

[Service]
User=nginx
Group=nginx
Restart=always
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/php ${INSTALL_DIR}/artisan horizon
StandardOutput=append:/var/log/tuistream/horizon.log
StandardError=append:/var/log/tuistream/horizon-error.log

[Install]
WantedBy=multi-user.target
SYSTEMD

    systemctl daemon-reload
    systemctl enable tuistream-horizon
    systemctl start tuistream-horizon

    log_info "Queue workers configured"
}

# ──────────────────────────────────────
# Configure Reverb (WebSockets)
# ──────────────────────────────────────
configure_reverb() {
    log_section "Configuring Laravel Reverb"

    cat > /etc/systemd/system/tuistream-reverb.service <<SYSTEMD
[Unit]
Description=TuiStream Reverb WebSocket Server
After=network.target redis.service

[Service]
User=nginx
Group=nginx
Restart=always
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/php ${INSTALL_DIR}/artisan reverb:start --no-interaction
StandardOutput=append:/var/log/tuistream/reverb.log
StandardError=append:/var/log/tuistream/reverb-error.log

[Install]
WantedBy=multi-user.target
SYSTEMD

    systemctl daemon-reload
    systemctl enable tuistream-reverb
    systemctl start tuistream-reverb

    log_info "Reverb WebSocket server configured"
}

# ──────────────────────────────────────
# Configure Scheduler
# ──────────────────────────────────────
configure_scheduler() {
    log_section "Configuring Laravel Scheduler"

    echo "* * * * * nginx /usr/bin/php ${INSTALL_DIR}/artisan schedule:run >> /var/log/tuistream/scheduler.log 2>&1" \
        > /etc/cron.d/tuistream-scheduler

    log_info "Scheduler configured"
}

# ──────────────────────────────────────
# Create log directories
# ──────────────────────────────────────
setup_logs() {
    mkdir -p /var/log/tuistream
    chown -R nginx:nginx /var/log/tuistream
}

# ──────────────────────────────────────
# Installation summary
# ──────────────────────────────────────
summary() {
    log_section "Installation Complete!"

    echo -e "${GREEN}${BOLD}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║     TuiStream Installed Successfully!     ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${BOLD}Access URLs:${NC}"
    echo -e "  Website:    ${CYAN}https://${DOMAIN}${NC}"
    echo -e "  Horizon:    ${CYAN}https://${DOMAIN}/horizon${NC}"
    echo ""
    echo -e "${BOLD}Default Admin Login:${NC}"
    echo -e "  Email:      ${CYAN}info@hostuis.com${NC}"
    echo -e "  Password:   ${CYAN}Emely.2012@#${NC}"
    echo ""
    echo -e "${YELLOW}⚠ Change the default admin password immediately after login!${NC}"
    echo ""
    echo -e "${BOLD}MySQL Credentials:${NC}"
    echo -e "  Database:   ${CYAN}${MYSQL_DB}${NC}"
    echo -e "  User:       ${CYAN}${MYSQL_USER}${NC}"
    echo -e "  Password:   ${CYAN}${MYSQL_PASSWORD}${NC}"
    echo ""
    echo -e "${BOLD}Icecast Passwords:${NC}"
    echo -e "  Source:     ${CYAN}${ICECAST_SOURCE_PASS}${NC}"
    echo -e "  Admin:      ${CYAN}${ICECAST_ADMIN_PASS}${NC}"
    echo ""
    echo -e "${BOLD}Open Ports:${NC}"
    echo -e "  SSH: 22 | HTTP: 80 | HTTPS: 443 | Icecast: 8000-8001"
    echo -e "  RTMP: 1935 | HLS: 8080 | DASH: 8081 | WS: 6001"
    echo ""
    echo -e "${BOLD}Services:${NC}"
    echo -e "  Check status: systemctl status nginx php-fpm redis mysql icecast"
    echo -e "  Logs: /var/log/tuistream/"
    echo ""
}

# ──────────────────────────────────────
# Main installation flow
# ──────────────────────────────────────
main() {
    banner

    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root."
        exit 1
    fi

    detect_os
    collect_info
    system_update

    install_php
    install_composer
    install_nodejs
    install_mysql
    install_redis
    install_nginx
    install_ffmpeg
    install_icecast
    install_liquidsoap

    configure_firewall
    configure_selinux

    setup_logs
    clone_repository
    setup_application
    configure_nginx_vhost
    setup_ssl
    configure_queue_workers
    configure_reverb
    configure_scheduler

    summary
}

# Run main
main "$@"
