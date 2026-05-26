FROM php:8.4-cli-alpine

# Instalar dependencias del sistema y herramientas de compilación
RUN apk add --no-cache \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    bash \
    postgresql-dev \
    libzip-dev \
    oniguruma-dev \
    nodejs \
    npm \
    supervisor \
    linux-headers \
    $PHPIZE_DEPS

# Instalar extensiones de PHP necesarias para Laravel
RUN docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    gd \
    intl \
    pcntl \
    opcache

# Instalar e habilitar Redis y Swoole para Laravel Octane
RUN pecl install redis swoole \
    && docker-php-ext-enable redis swoole

# Descargar e instalar Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Configurar el directorio de trabajo
WORKDIR /var/www

# Exponer el puerto por defecto de Laravel Octane (8000) y Reverb (8080)
EXPOSE 8000 8080

# Comando por defecto para iniciar (será sobreescrito en docker-compose para desarrollo)
CMD ["php", "artisan", "octane:start", "--host=0.0.0.0", "--port=8000"]
