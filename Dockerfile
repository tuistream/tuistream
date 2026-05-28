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
    postgresql-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    $PHPIZE_DEPS \
    && pip3 install --no-cache-dir yt-dlp --break-system-packages \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_pgsql \
        zip \
        bcmath \
        gd \
        intl \
        pcntl \
        opcache \
    && printf '\n' | pecl install redis \
    && docker-php-ext-enable redis \
    && printf 'yes\nno\nno\nno\nno\nno\nno\n' | pecl install swoole \
    && docker-php-ext-enable swoole \
    && apk del $PHPIZE_DEPS

COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

EXPOSE 8000 8080

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
