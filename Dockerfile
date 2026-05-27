FROM php:8.4-cli-alpine

# Instalar dependencias del sistema y herramientas de compilación
RUN apk add --no-cache \
    curl \
    git \
    bash \
    nodejs \
    npm \
    supervisor \
    linux-headers

# Añadir instalador de extensiones PHP (muy robusto y automático)
ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

# Instalar extensiones de PHP necesarias para Laravel, Redis y Swoole
RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    gd \
    intl \
    pcntl \
    opcache \
    redis \
    swoole

# Copiar configuración de límites de subida de PHP (3GB)
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Descargar e instalar Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Configurar el directorio de trabajo
WORKDIR /var/www

# Exponer el puerto por defecto de Laravel Octane (8000) y Reverb (8080)
EXPOSE 8000 8080

# Comando por defecto para iniciar (será sobreescrito en docker-compose para desarrollo)
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
