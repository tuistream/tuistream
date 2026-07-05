#!/bin/bash
#
# TuiStream - Installation Server Setup Helper
# Helps you set up your own installation server (e.g., instalar.hostuis.com)
# 
# Usage:
#   bash setup-install-server.sh
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
# Helper functions
# ──────────────────────────────────────
log_info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_section() { echo -e "\n${CYAN}${BOLD}═══ $1 ═══${NC}\n"; }

banner() {
    clear
    echo -e "${BLUE}${BOLD}"
    echo "╔════════════════════════════════════════════╗"
    echo "║  TuiStream Installation Server Setup        ║"
    echo "║  Configure your own installation URL       ║"
    echo "║  (e.g., https://instalar.hostuis.com)      ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ──────────────────────────────────────
# Main Setup
# ──────────────────────────────────────
setup_install_server() {
    log_section "Installation Server Configuration"
    
    read -p "Enter your installation subdomain [instalar.hostuis.com]: " INSTALL_DOMAIN
    INSTALL_DOMAIN="${INSTALL_DOMAIN:-instalar.hostuis.com}"
    
    read -p "Enter your main domain [hostuis.com]: " MAIN_DOMAIN
    MAIN_DOMAIN="${MAIN_DOMAIN:-hostuis.com}"
    
    read -p "Enter installation directory path [/var/www/instalar]: " INSTALL_PATH
    INSTALL_PATH="${INSTALL_PATH:-/var/www/instalar}"
    
    read -p "Enter your email for SSL [admin@${MAIN_DOMAIN}]: " ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${MAIN_DOMAIN}}"
    
    echo ""
    log_info "Subdomain: ${BOLD}$INSTALL_DOMAIN${NC}"
    log_info "Main Domain: ${BOLD}$MAIN_DOMAIN${NC}"
    log_info "Path: ${BOLD}$INSTALL_PATH${NC}"
    log_info "Email: ${BOLD}$ADMIN_EMAIL${NC}"
    echo ""
    read -p "Continue? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        log_error "Setup cancelled."
        exit 0
    fi
}

# ──────────────────────────────────────
# Create directories
# ──────────────────────────────────────
create_directories() {
    log_section "Creating Directories"
    
    mkdir -p $INSTALL_PATH
    mkdir -p $INSTALL_PATH/releases
    mkdir -p $INSTALL_PATH/scripts
    
    log_info "Directories created"
}

# ──────────────────────────────────────
# Setup Nginx Virtual Host
# ──────────────────────────────────────
setup_nginx_vhost() {
    log_section "Configuring Nginx Virtual Host"
    
    cat > /etc/nginx/conf.d/${INSTALL_DOMAIN}.conf <<'NGINX'
server {
    listen 80;
    server_name INSTALL_DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name INSTALL_DOMAIN_PLACEHOLDER;

    root INSTALL_PATH_PLACEHOLDER;
    index index.html index.php;

    ssl_certificate /etc/letsencrypt/live/INSTALL_DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/INSTALL_DOMAIN_PLACEHOLDER/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Cache static files
    location ~* \.(sh|tar\.gz|zip|pdf)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Block direct access to sensitive files
    location ~ /\.(?!well-known) {
        deny all;
    }

    location / {
        try_files $uri $uri/ =404;
    }

    # Log files only for debugging
    access_log /var/log/nginx/instalar-access.log;
    error_log /var/log/nginx/instalar-error.log;
}
NGINX

    sed -i "s|INSTALL_DOMAIN_PLACEHOLDER|${INSTALL_DOMAIN}|g" /etc/nginx/conf.d/${INSTALL_DOMAIN}.conf
    sed -i "s|INSTALL_PATH_PLACEHOLDER|${INSTALL_PATH}|g" /etc/nginx/conf.d/${INSTALL_DOMAIN}.conf

    nginx -t && systemctl reload nginx
    log_info "Nginx virtual host configured"
}

# ──────────────────────────────────────
# Setup SSL Certificate
# ──────────────────────────────────────
setup_ssl() {
    log_section "Setting up SSL Certificate"
    
    if command -v certbot &> /dev/null; then
        certbot --nginx -d ${INSTALL_DOMAIN} --non-interactive --agree-tos -m ${ADMIN_EMAIL}
        log_info "SSL certificate installed"
    else
        log_warn "Certbot not installed. Install it manually:"
        log_warn "  Ubuntu: apt-get install certbot python3-certbot-nginx"
        log_warn "  RHEL: dnf install certbot python3-certbot-nginx"
        log_warn "  Then run: certbot --nginx -d ${INSTALL_DOMAIN}"
    fi
}

# ──────────────────────────────────────
# Copy Installation Scripts
# ──────────────────────────────────────
copy_installation_scripts() {
    log_section "Copying Installation Scripts"
    
    # Find the install script
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    if [ -f "$SCRIPT_DIR/install.tuistream.sh" ]; then
        cp "$SCRIPT_DIR/install.tuistream.sh" "$INSTALL_PATH/install.sh"
        chmod +x "$INSTALL_PATH/install.sh"
        log_info "Installation script copied"
    else
        log_warn "install.tuistream.sh not found in $SCRIPT_DIR"
        log_warn "Please copy it manually to $INSTALL_PATH/install.sh"
    fi
}

# ──────────────────────────────────────
# Create Release Directories
# ──────────────────────────────────────
create_release_dirs() {
    log_section "Creating Release Directories"
    
    cat > $INSTALL_PATH/releases/README.md <<'README'
# TuiStream Releases

Place your TuiStream release tarballs here:

```
- tuistream-v1.0.0.tar.gz
- tuistream-v1.1.0.tar.gz
- tuistream-latest.tar.gz (symlink to latest version)
```

## Usage

Install from specific release:
```bash
TARBALL_URL=https://instalar.hostuis.com/releases/tuistream-v1.0.0.tar.gz bash <(curl -sSL https://instalar.hostuis.com/install.sh)
```

Install latest version:
```bash
TARBALL_URL=https://instalar.hostuis.com/releases/tuistream-latest.tar.gz bash <(curl -sSL https://instalar.hostuis.com/install.sh)
```
README

    log_info "Release directory created with README"
}

# ──────────────────────────────────────
# Create Helper Scripts
# ──────────────────────────────────────
create_helper_scripts() {
    log_section "Creating Helper Scripts"
    
    # Quick install script
    cat > $INSTALL_PATH/scripts/quick-install.sh <<'QUICKINSTALL'
#!/bin/bash
# Quick TuiStream installation from instalar subdomain

DOMAIN=${1:-}
EMAIL=${2:-}

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./quick-install.sh <domain> <email>"
    echo "Example: ./quick-install.sh tuistream.example.com admin@example.com"
    exit 1
fi

INSTALL_SERVER="https://instalar.hostuis.com"

DOMAIN=$DOMAIN \
ADMIN_EMAIL=$EMAIL \
TARBALL_URL="${INSTALL_SERVER}/releases/tuistream-latest.tar.gz" \
INSTALL_METHOD=tarball \
bash <(curl -sSL ${INSTALL_SERVER}/install.sh)
QUICKINSTALL

    chmod +x $INSTALL_PATH/scripts/quick-install.sh
    log_info "Quick install script created"
}

# ──────────────────────────────────────
# Create Documentation
# ──────────────────────────────────────
create_documentation() {
    log_section "Creating Documentation"
    
    cat > $INSTALL_PATH/INDEX.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TuiStream Installer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        code {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            display: block;
            margin: 10px 0;
            overflow-x: auto;
            font-size: 13px;
            color: #333;
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        a.button {
            flex: 1;
            padding: 12px;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .button-primary {
            background: #667eea;
            color: white;
        }
        .button-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .button-secondary {
            background: #f5f5f5;
            color: #333;
        }
        .button-secondary:hover {
            background: #e0e0e0;
        }
        .info {
            background: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .warning {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 TuiStream Installer</h1>
        <p class="subtitle">Streaming Control Panel - Automatic Installation</p>

        <div class="section">
            <h2>Quick Install</h2>
            <p>Run this command on your server:</p>
            <code>curl -sSL https://instalar.hostuis.com/install.sh | bash</code>
        </div>

        <div class="section">
            <h2>Install with Options</h2>
            <code>DOMAIN=tuistream.example.com ADMIN_EMAIL=admin@example.com bash &lt;(curl -sSL https://instalar.hostuis.com/install.sh)</code>
        </div>

        <div class="info">
            <strong>ℹ️ Requirements:</strong><br>
            • Linux Server (AlmaLinux 9, Rocky 9, or Ubuntu 24.04)<br>
            • Root access via SSH<br>
            • 4GB RAM minimum<br>
            • 20GB disk space minimum
        </div>

        <div class="section">
            <h2>Available Releases</h2>
            <p>Download specific versions:</p>
            <code>ls -lh releases/</code>
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong><br>
            This installer will configure MySQL, PHP, Node.js, and other services. Make sure you're installing on a dedicated server.
        </div>

        <div class="button-group">
            <a href="releases/" class="button button-secondary">📦 Releases</a>
            <a href="https://github.com/hostuis/tuistream" class="button button-primary">📖 Documentation</a>
        </div>
    </div>
</body>
</html>
HTML

    log_info "Documentation created"
}

# ──────────────────────────────────────
# Set Permissions
# ──────────────────────────────────────
set_permissions() {
    log_section "Setting Permissions"
    
    chown -R www-data:www-data $INSTALL_PATH 2>/dev/null || \
    chown -R nginx:nginx $INSTALL_PATH 2>/dev/null || \
    chown -R nobody:nobody $INSTALL_PATH
    
    chmod 755 $INSTALL_PATH
    chmod 755 $INSTALL_PATH/scripts
    chmod 755 $INSTALL_PATH/releases
    
    log_info "Permissions set"
}

# ──────────────────────────────────────
# Summary
# ──────────────────────────────────────
summary() {
    log_section "Installation Server Setup Complete!"
    
    echo -e "${GREEN}${BOLD}✓ Your installation server is ready!${NC}\n"
    
    echo -e "${BOLD}Access URLs:${NC}"
    echo -e "  🌐 https://${INSTALL_DOMAIN}"
    echo -e "  📦 https://${INSTALL_DOMAIN}/releases"
    echo -e "  🔧 https://${INSTALL_DOMAIN}/install.sh\n"
    
    echo -e "${BOLD}Quick Install Command:${NC}"
    echo -e "  ${CYAN}curl -sSL https://${INSTALL_DOMAIN}/install.sh | bash${NC}\n"
    
    echo -e "${BOLD}Next Steps:${NC}"
    echo -e "  1. Upload TuiStream releases to: ${INSTALL_PATH}/releases/"
    echo -e "  2. Create a symlink to latest: cd ${INSTALL_PATH}/releases && ln -s tuistream-v1.0.0.tar.gz tuistream-latest.tar.gz"
    echo -e "  3. Test the installation:\n"
    echo -e "     ${CYAN}curl -I https://${INSTALL_DOMAIN}/install.sh${NC}\n"
    
    echo -e "${BOLD}Directory Structure:${NC}"
    echo -e "  ${INSTALL_PATH}/"
    echo -e "  ├── install.sh"
    echo -e "  ├── releases/"
    echo -e "  │   ├── tuistream-v1.0.0.tar.gz"
    echo -e "  │   └── tuistream-latest.tar.gz (symlink)"
    echo -e "  └── scripts/"
    echo -e "      └── quick-install.sh\n"
}

# ──────────────────────────────────────
# Main
# ──────────────────────────────────────
main() {
    banner
    
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root."
        exit 1
    fi
    
    setup_install_server
    create_directories
    setup_nginx_vhost
    setup_ssl
    copy_installation_scripts
    create_release_dirs
    create_helper_scripts
    create_documentation
    set_permissions
    summary
}

main "$@"
