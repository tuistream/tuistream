#!/usr/bin/env bash
#===============================================================================
# TuiStream — Inicializador de certificado SSL (Let's Encrypt)
#===============================================================================
# Ejecutar después de que nginx-proxy esté corriendo:
#   docker exec tuistream_certbot certbot certonly --webroot -w /var/www/certbot \
#     -d TU_DOMINIO --email TU_EMAIL --agree-tos --non-interactive
#
# Para renovación automática (cada 12h), el contenedor certbot ya lo hace.
#===============================================================================

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Uso: $0 <dominio> <email>"
    echo "Ej:  $0 radio.midominio.com admin@midominio.com"
    exit 1
fi

DOMAIN="$1"
EMAIL="$2"

echo "Obteniendo certificado SSL para ${DOMAIN}..."
docker exec tuistream_certbot certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --non-interactive \
    --force-renewal 2>&1 | while read line; do echo "    $line"; done

echo ""
echo "Certificado obtenido. Reiniciando nginx-proxy..."
docker exec tuistream_nginx_proxy nginx -s reload

echo ""
echo "SSL configurado correctamente para https://${DOMAIN}"
