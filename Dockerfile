FROM php:8.4-cli-alpine

RUN apk add --no-cache \
    curl \
    git \
    bash \
    nodejs \
    npm \
    supervisor \
    linux-headers \
    python3 \
    py3-pip \
    ffmpeg \
    postgresql-dev

RUN pip3 install --no-cache-dir yt-dlp --break-system-packages

RUN docker-php-ext-install pdo_pgsql

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions && \
    install-php-extensions \
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
