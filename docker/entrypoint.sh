#!/bin/sh
set -e

echo "[tuistream] Running startup optimizations..."

php artisan storage:link --force 2>/dev/null
php artisan config:cache 2>/dev/null
php artisan route:cache 2>/dev/null
php artisan view:cache 2>/dev/null
php artisan event:cache 2>/dev/null

# Migrate if needed (non-blocking)
php artisan migrate --force --no-interaction 2>/dev/null || true

echo "[tuistream] Startup complete."
exec "$@"
