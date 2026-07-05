<?php

return [

    'default' => env('LOG_CHANNEL', 'stack'),

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace'   => false,
    ],

    'channels' => [

        'stack' => [
            'driver'            => 'stack',
            'channels'          => explode(',', env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
        ],

        'daily' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/laravel.log'),
            'level'  => env('LOG_LEVEL', 'debug'),
            'days'   => env('LOG_DAILY_DAYS', 14),
        ],

        // Canal dedicado para la API externa
        'external_api' => [
            'driver' => 'daily',
            'path'   => storage_path('logs/external-api.log'),
            'level'  => env('LOG_LEVEL', 'info'),
            'days'   => 30,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

    ],

];
