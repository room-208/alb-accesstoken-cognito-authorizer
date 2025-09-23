FROM php:8.4-apache

RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY index.php /var/www/html/index.php

EXPOSE 80