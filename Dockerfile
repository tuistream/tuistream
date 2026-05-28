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
    icu-dev

RUN pip3 install --no-cache-dir yt-dlp --break-system-packages

RUN apk add --no-cache --virtual .build-deps \
        autoconf \
        automake \
        g++ \
        gcc \
        make \
        pkgconf \
        re2c \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_pgsql \
        zip \
        bcmath \
        gd \
        intl \
        pcntl \
        opcache \
    && yes "" | pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .build-deps

COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
