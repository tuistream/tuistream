<?php

return [
    'api_path' => 'api/v1',

    'api_domain' => null,

    'export_path' => 'admin/api-docs',

    'info' => [
        'title' => 'TuiStream API',
        'description' => 'API REST para gestión de emisoras de streaming TuiStream.',
        'version' => '1.0.0',
    ],

    'servers' => [
        'local' => [
            'url' => config('app.url'),
            'description' => 'Servidor local',
        ],
    ],

    'middleware' => [
        'web',
        'auth',
        'admin.role',
    ],

    'extensions' => [
        //
    ],

    'defaults' => [
        // 'Status' => 200,
    ],

    'ui' => [
        'hide_try_it' => false,
        'logo' => '',
        'theme' => 'light',
    ],
];
