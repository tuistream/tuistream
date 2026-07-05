<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateOpenApiSpec extends Command
{
    protected $signature = 'openapi:generate';
    protected $description = 'Generate OpenAPI 3.0 specification for external API';

    public function handle()
    {
        $host = rtrim(config('app.url'), '/');
        $spec = [
            'openapi' => '3.0.3',
            'info' => [
                'title'       => 'TuiStream API',
                'description' => 'API RESTful para integración con sistemas externos. Permite acceder a estaciones de radio, canales de TV, medios, playlists y estadísticas en tiempo real.',
                'version'     => '1.0.0',
                'contact'     => [
                    'name'  => 'TuiStream Team',
                    'email' => 'api@tuistream.com',
                ],
            ],
            'servers' => [
                ['url' => $host . '/api/v1', 'description' => 'Servidor principal'],
            ],
            'security' => [
                ['bearerAuth' => []],
            ],
            'paths' => $this->buildPaths(),
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type'        => 'http',
                        'scheme'      => 'bearer',
                        'bearerFormat'=> 'Sanctum Token',
                        'description' => 'Token de API generado desde el panel de administración.',
                    ],
                ],
                'schemas' => $this->buildSchemas(),
            ],
        ];

        $dir = storage_path('openapi');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(
            $dir . '/openapi.json',
            json_encode($spec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );

        $this->info('OpenAPI spec generated: storage/openapi/openapi.json');
    }

    private function buildPaths(): array
    {
        return [
            '/health' => [
                'get' => [
                    'tags'        => ['Health'],
                    'summary'     => 'Verificar estado del servicio',
                    'operationId' => 'healthCheck',
                    'security'    => [],
                    'responses'   => [
                        '200' => [
                            'description' => 'Servicio operativo',
                            'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/HealthResponse']]],
                        ],
                    ],
                ],
            ],
            '/me' => [
                'get' => [
                    'tags'        => ['Autenticación'],
                    'summary'     => 'Obtener perfil del cliente autenticado',
                    'operationId' => 'getProfile',
                    'responses'   => [
                        '200' => ['description' => 'Perfil del cliente'],
                        '401' => ['description' => 'No autenticado'],
                    ],
                ],
            ],
            '/stations' => [
                'get' => [
                    'tags'        => ['Estaciones'],
                    'summary'     => 'Listar estaciones del cliente',
                    'operationId' => 'listStations',
                    'responses'   => [
                        '200' => ['description' => 'Lista de estaciones'],
                        '401' => ['description' => 'No autenticado'],
                    ],
                ],
            ],
            '/stations/{id}' => [
                'get' => [
                    'tags'        => ['Estaciones'],
                    'summary'     => 'Ver detalle de estación',
                    'operationId' => 'getStation',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses'   => [
                        '200' => ['description' => 'Detalle de estación'],
                        '404' => ['description' => 'No encontrado'],
                    ],
                ],
            ],
            '/stations/{id}/listeners' => [
                'get' => [
                    'tags'        => ['Estaciones'],
                    'summary'     => 'Oyentes actuales de una estación',
                    'operationId' => 'getStationListeners',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Datos de oyentes'],
                    ],
                ],
            ],
            '/stations/{id}/song-history' => [
                'get' => [
                    'tags'        => ['Estaciones'],
                    'summary'     => 'Historial de canciones',
                    'operationId' => 'getStationSongHistory',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Historial de canciones'],
                    ],
                ],
            ],
            '/tv-channels' => [
                'get' => [
                    'tags'        => ['Canales TV'],
                    'summary'     => 'Listar canales de TV',
                    'operationId' => 'listTvChannels',
                    'responses'   => [
                        '200' => ['description' => 'Lista de canales'],
                    ],
                ],
            ],
            '/tv-channels/{id}' => [
                'get' => [
                    'tags'        => ['Canales TV'],
                    'summary'     => 'Ver detalle de canal',
                    'operationId' => 'getTvChannel',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Detalle de canal'],
                    ],
                ],
            ],
            '/tv-channels/{id}/viewers' => [
                'get' => [
                    'tags'        => ['Canales TV'],
                    'summary'     => 'Espectadores actuales',
                    'operationId' => 'getTvChannelViewers',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Datos de espectadores'],
                    ],
                ],
            ],
            '/tv-channels/{id}/schedule' => [
                'get' => [
                    'tags'        => ['Canales TV'],
                    'summary'     => 'Programación del canal',
                    'operationId' => 'getTvChannelSchedule',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Grilla de programación'],
                    ],
                ],
            ],
            '/media' => [
                'get' => [
                    'tags'        => ['Medios'],
                    'summary'     => 'Listar archivos multimedia',
                    'operationId' => 'listMedia',
                    'parameters'  => [
                        ['name' => 'type', 'in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'audio, video, image'],
                        ['name' => 'folder_id', 'in' => 'query', 'schema' => ['type' => 'integer']],
                        ['name' => 'search', 'in' => 'query', 'schema' => ['type' => 'string']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Archivos (paginados)'],
                    ],
                ],
            ],
            '/media/{id}' => [
                'get' => [
                    'tags'        => ['Medios'],
                    'summary'     => 'Ver detalle de archivo',
                    'operationId' => 'getMedia',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Detalle de archivo'],
                    ],
                ],
            ],
            '/playlists' => [
                'get' => [
                    'tags'        => ['Playlists'],
                    'summary'     => 'Listar playlists',
                    'operationId' => 'listPlaylists',
                    'responses'   => [
                        '200' => ['description' => 'Lista de playlists'],
                    ],
                ],
            ],
            '/playlists/{id}' => [
                'get' => [
                    'tags'        => ['Playlists'],
                    'summary'     => 'Ver detalle de playlist',
                    'operationId' => 'getPlaylist',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Detalle de playlist con medios y horarios'],
                    ],
                ],
            ],
            '/playlists/{id}/media' => [
                'get' => [
                    'tags'        => ['Playlists'],
                    'summary'     => 'Medios de una playlist',
                    'operationId' => 'getPlaylistMedia',
                    'parameters'  => [
                        ['name' => 'id', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Medios ordenados de la playlist'],
                    ],
                ],
            ],
            '/stats/summary' => [
                'get' => [
                    'tags'        => ['Estadísticas'],
                    'summary'     => 'Resumen de estadísticas',
                    'operationId' => 'getStatsSummary',
                    'responses'   => [
                        '200' => ['description' => 'Resumen consolidado'],
                    ],
                ],
            ],
            '/stats/listeners/{station}' => [
                'get' => [
                    'tags'        => ['Estadísticas'],
                    'summary'     => 'Estadísticas de oyentes',
                    'operationId' => 'getListenerStats',
                    'parameters'  => [
                        ['name' => 'station', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ['name' => 'period', 'in' => 'query', 'schema' => ['type' => 'string', 'default' => '24h']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Estadísticas de oyentes'],
                    ],
                ],
            ],
            '/stats/viewers/{channel}' => [
                'get' => [
                    'tags'        => ['Estadísticas'],
                    'summary'     => 'Estadísticas de espectadores',
                    'operationId' => 'getViewerStats',
                    'parameters'  => [
                        ['name' => 'channel', 'in' => 'path', 'required' => true, 'schema' => ['type' => 'integer']],
                        ['name' => 'period', 'in' => 'query', 'schema' => ['type' => 'string', 'default' => '24h']],
                    ],
                    'responses' => [
                        '200' => ['description' => 'Estadísticas de espectadores'],
                    ],
                ],
            ],
            '/sync/status' => [
                'get' => [
                    'tags'        => ['Sincronización'],
                    'summary'     => 'Estado de sincronización',
                    'operationId' => 'getSyncStatus',
                    'responses'   => [
                        '200' => ['description' => 'Estado del cliente'],
                    ],
                ],
            ],
            '/sync/events' => [
                'post' => [
                    'tags'        => ['Sincronización'],
                    'summary'     => 'Recibir evento del sistema externo',
                    'operationId' => 'receiveSyncEvent',
                    'requestBody' => [
                        'required' => true,
                        'content'  => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/SyncEvent'],
                            ],
                        ],
                    ],
                    'responses' => [
                        '201' => ['description' => 'Evento recibido'],
                        '422' => ['description' => 'Error de validación'],
                    ],
                ],
            ],
        ];
    }

    private function buildSchemas(): array
    {
        return [
            'HealthResponse' => [
                'type'       => 'object',
                'properties' => [
                    'status'    => ['type' => 'string', 'example' => 'ok'],
                    'app'       => ['type' => 'string', 'example' => 'TuiStream'],
                    'version'   => ['type' => 'string', 'example' => '1.0.0'],
                    'timezone'  => ['type' => 'string', 'example' => 'America/Chicago'],
                    'timestamp' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Station' => [
                'type'       => 'object',
                'properties' => [
                    'id'                => ['type' => 'integer'],
                    'name'              => ['type' => 'string'],
                    'slug'              => ['type' => 'string'],
                    'description'       => ['type' => 'string', 'nullable' => true],
                    'genre'             => ['type' => 'string', 'nullable' => true],
                    'bitrate'           => ['type' => 'integer'],
                    'audio_format'      => ['type' => 'string'],
                    'max_listeners'     => ['type' => 'integer'],
                    'is_active'         => ['type' => 'boolean'],
                    'current_listeners' => ['type' => 'integer', 'nullable' => true],
                    'peak_listeners'    => ['type' => 'integer', 'nullable' => true],
                    'current_song'      => ['type' => 'string', 'nullable' => true],
                    'mount_point'       => ['type' => 'string', 'nullable' => true],
                ],
            ],
            'TvChannel' => [
                'type'       => 'object',
                'properties' => [
                    'id'              => ['type' => 'integer'],
                    'name'            => ['type' => 'string'],
                    'description'     => ['type' => 'string', 'nullable' => true],
                    'resolution'      => ['type' => 'string'],
                    'is_live'         => ['type' => 'boolean'],
                    'current_viewers' => ['type' => 'integer', 'nullable' => true],
                    'peak_viewers'    => ['type' => 'integer', 'nullable' => true],
                    'hls_url'         => ['type' => 'string', 'nullable' => true],
                    'dash_url'        => ['type' => 'string', 'nullable' => true],
                ],
            ],
            'SyncEvent' => [
                'type'       => 'object',
                'required'   => ['event', 'payload'],
                'properties' => [
                    'event'     => ['type' => 'string', 'description' => 'Nombre del evento', 'example' => 'media.uploaded'],
                    'payload'   => ['type' => 'object', 'description' => 'Datos del evento'],
                    'timestamp' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Error' => [
                'type'       => 'object',
                'properties' => [
                    'message' => ['type' => 'string'],
                    'errors'  => ['type' => 'object', 'nullable' => true],
                ],
            ],
        ];
    }
}
