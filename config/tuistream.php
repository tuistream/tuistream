<?php

return [

    /*
    |--------------------------------------------------------------------------
    | TuiStream Configuration
    |--------------------------------------------------------------------------
    */

    'version' => '1.0.0',

    'streaming' => [
        'audio' => [
            'formats' => ['mp3', 'aac', 'ogg'],
            'default_bitrate' => 128,
            'max_bitrate' => 320,
            'icecast' => [
                'host' => env('ICECAST_HOST', '127.0.0.1'),
                'port' => env('ICECAST_PORT', 8000),
                'ssl_port' => env('ICECAST_SSL_PORT', 8001),
                'source_password' => env('ICECAST_SOURCE_PASSWORD'),
                'admin_password' => env('ICECAST_ADMIN_PASSWORD'),
                'relay_password' => env('ICECAST_RELAY_PASSWORD'),
            ],
        ],
        'video' => [
            'formats' => ['mp4', 'mov', 'mkv', 'webm'],
            'rtmp' => [
                'host' => env('RTMP_HOST', '127.0.0.1'),
                'port' => env('RTMP_PORT', 1935),
            ],
            'hls_port' => env('HLS_PORT', 8080),
            'dash_port' => env('DASH_PORT', 8081),
        ],
    ],

    'media' => [
        'audio_extensions' => ['mp3', 'aac', 'wav', 'ogg'],
        'video_extensions' => ['mp4', 'mov', 'mkv', 'webm'],
        'max_upload_size' => 512, // MB
        'chunk_upload' => true,
    ],

    'limits' => [
        'default_disk_quota' => 1024, // MB
        'default_listeners' => 100,
        'default_bitrate' => 128,
    ],

    'monitoring' => [
        'interval' => 30, // seconds
        'retention_days' => 30,
    ],

];
