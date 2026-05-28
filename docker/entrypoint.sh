#!/bin/sh
set -e

echo "[tuistream] Running startup..."

php artisan storage:link --force 2>/dev/null
php artisan migrate --force --no-interaction 2>/dev/null || true

# Only cache in production
if [ "$APP_ENV" = "production" ]; then
    echo "[tuistream] Production mode: caching routes, config, views..."
    php artisan config:cache 2>/dev/null
    php artisan route:cache 2>/dev/null
    php artisan view:cache 2>/dev/null
    php artisan event:cache 2>/dev/null
else
    echo "[tuistream] Dev mode: no caching"
fi

echo "[tuistream] Startup complete."
exec "$@"
