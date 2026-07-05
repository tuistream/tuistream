<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';

// ── Estado ─────────────────────────────────────────────────────────────
const activeTab = ref<'overview' | 'endpoints' | 'tokens'>('overview');
const copiedEndpoint = ref('');
const showToken = ref<Record<string, boolean>>({});
const newTokenName = ref('');
const newTokenAbilities = ref<string[]>(['read']);
const tokenCreated = ref<{ name: string; token: string } | null>(null);

// ── Datos de endpoints ─────────────────────────────────────────────────
const endpointGroups = [
    {
        name: 'Health',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/health', auth: false,
                summary: 'Verificar estado del servicio',
                description: 'Endpoint público para verificar que la API está operativa. Retorna estado, versión y timestamp.',
                responses: [
                    { code: 200, body: `{
  "status": "ok",
  "app": "TuiStream",
  "version": "1.0.0",
  "timezone": "America/Chicago",
  "timestamp": "2026-06-10T12:00:00-05:00"
}` }
                ]
            },
        ],
    },
    {
        name: 'Autenticación',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/me', auth: true,
                summary: 'Obtener perfil del cliente autenticado',
                description: 'Devuelve los datos del cliente asociado al token de API.',
                responses: [
                    { code: 200, body: `{
  "data": {
    "id": 1,
    "name": "Cliente Demo",
    "email": "cliente@demo.com",
    "roles": ["client"],
    "is_active": true
  }
}` },
                    { code: 401, body: `{ "message": "Unauthenticated." }` },
                ]
            },
        ],
    },
    {
        name: 'Estaciones (Radio / AutoDJ)',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/stations', auth: true,
                summary: 'Listar estaciones del cliente',
                description: 'Obtiene todas las estaciones de radio pertenecientes al cliente autenticado.',
                responses: [
                    { code: 200, body: `{
  "data": [
    {
      "id": 1,
      "name": "Mi Radio",
      "slug": "mi-radio",
      "description": "Descripción...",
      "genre": "Pop",
      "bitrate": 128,
      "audio_format": "mp3",
      "max_listeners": 100,
      "is_active": true,
      "current_listeners": 42,
      "peak_listeners": 85,
      "current_song": "Artista - Canción",
      "mount_point": "/stream",
      "client": { "id": 1, "name": "Cliente" }
    }
  ]
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/stations/{id}', auth: true,
                summary: 'Ver detalle de estación',
                description: 'Obtiene los datos completos de una estación, incluyendo playlists y horarios.',
                responses: [
                    { code: 200, body: '{ "data": { ...station, playlists: [...], schedules: [...] } }' },
                    { code: 404, body: '{ "message": "No encontrado." }' },
                ]
            },
            {
                method: 'GET', path: '/api/v1/stations/{id}/listeners', auth: true,
                summary: 'Oyentes actuales de una estación',
                description: 'Métrica en tiempo real de oyentes, pico y estado de la transmisión.',
                responses: [
                    { code: 200, body: `{
  "data": {
    "station_id": 1,
    "current_listeners": 42,
    "peak_listeners": 85,
    "max_listeners": 100,
    "bitrate": 128,
    "audio_format": "mp3",
    "is_active": true,
    "current_song": "Artista - Canción"
  }
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/stations/{id}/song-history', auth: true,
                summary: 'Historial de canciones reproducidas',
                description: 'Últimas 50 canciones reproducidas en la estación.',
                responses: [
                    { code: 200, body: `{
  "data": [
    {
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "played_at": "2026-06-10T11:45:00-05:00",
      "duration": 354
    }
  ]
}` },
                ]
            },
        ],
    },
    {
        name: 'Canales de TV',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/tv-channels', auth: true,
                summary: 'Listar canales de TV del cliente',
                description: 'Obtiene todos los canales de TV del cliente.',
                responses: [
                    { code: 200, body: `{
  "data": [
    {
      "id": 1,
      "name": "Mi Canal",
      "description": "Canal 24/7",
      "resolution": "1920x1080",
      "is_live": true,
      "current_viewers": 150,
      "peak_viewers": 320,
      "hls_url": "https://...",
      "client": { "id": 1, "name": "Cliente" }
    }
  ]
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/tv-channels/{id}', auth: true,
                summary: 'Ver detalle de canal',
                responses: [
                    { code: 200, body: '{ "data": { ...channel } }' },
                    { code: 404, body: '{ "message": "No encontrado." }' },
                ]
            },
            {
                method: 'GET', path: '/api/v1/tv-channels/{id}/viewers', auth: true,
                summary: 'Espectadores actuales',
                description: 'Métrica en tiempo real de espectadores, pico y URLs de transmisión.',
                responses: [
                    { code: 200, body: `{
  "data": {
    "channel_id": 1,
    "current_viewers": 150,
    "peak_viewers": 320,
    "resolution": "1920x1080",
    "is_live": true,
    "hls_url": "https://...",
    "dash_url": "https://..."
  }
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/tv-channels/{id}/schedule', auth: true,
                summary: 'Programación del canal',
                description: 'Grilla de programación semanal del canal.',
                responses: [
                    { code: 200, body: `{
  "data": [
    {
      "id": 1,
      "day_of_week": 1,
      "start_time": "08:00:00",
      "end_time": "10:00:00",
      "is_active": true
    }
  ]
}` },
                ]
            },
        ],
    },
    {
        name: 'Medios / Biblioteca',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/media', auth: true,
                summary: 'Listar archivos multimedia',
                queryParams: [
                    { name: 'type', type: 'string', desc: 'Filtrar por tipo (audio, video, image)' },
                    { name: 'folder_id', type: 'integer', desc: 'Filtrar por carpeta' },
                    { name: 'search', type: 'string', desc: 'Búsqueda por título' },
                ],
                responses: [
                    { code: 200, body: `{
  "data": [ { "id": 1, "title": "...", "type": "audio", "duration": 234 } ],
  "pagination": { "current_page": 1, "last_page": 3, "per_page": 50, "total": 120 }
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/media/{id}', auth: true,
                summary: 'Ver detalle de archivo',
                responses: [
                    { code: 200, body: '{ "data": { ...media } }' },
                ]
            },
        ],
    },
    {
        name: 'Playlists',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/playlists', auth: true,
                summary: 'Listar playlists del cliente',
                responses: [
                    { code: 200, body: '{ "data": [ { "id": 1, "name": "Mi Playlist", "station": {...} } ] }' },
                ]
            },
            {
                method: 'GET', path: '/api/v1/playlists/{id}', auth: true,
                summary: 'Ver detalle de playlist (incluye medios y horarios)',
            },
            {
                method: 'GET', path: '/api/v1/playlists/{id}/media', auth: true,
                summary: 'Medios de una playlist (ordenados)',
            },
        ],
    },
    {
        name: 'Estadísticas',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/stats/summary', auth: true,
                summary: 'Resumen de estadísticas del cliente',
                description: 'Consolida totales de estaciones, canales, oyentes, espectadores y archivos.',
                responses: [
                    { code: 200, body: `{
  "data": {
    "stations": { "total": 3, "active": 2, "total_listeners": 85, "peak_listeners": 120 },
    "tv_channels": { "total": 2, "live": 1, "total_viewers": 150, "peak_viewers": 320 },
    "media": { "total_files": 450 },
    "generated_at": "2026-06-10T12:00:00-05:00"
  }
}` },
                ]
            },
            {
                method: 'GET', path: '/api/v1/stats/listeners/{station}', auth: true,
                summary: 'Estadísticas de oyentes de una estación',
                queryParams: [
                    { name: 'period', type: 'string', desc: 'Período (24h, 7d, 30d). Default: 24h' },
                ],
            },
            {
                method: 'GET', path: '/api/v1/stats/viewers/{channel}', auth: true,
                summary: 'Estadísticas de espectadores de un canal',
                queryParams: [
                    { name: 'period', type: 'string', desc: 'Período (24h, 7d, 30d). Default: 24h' },
                ],
            },
        ],
    },
    {
        name: 'Sincronización / Webhooks',
        endpoints: [
            {
                method: 'GET', path: '/api/v1/sync/status', auth: true,
                summary: 'Estado de sincronización',
                description: 'Devuelve cuándo fue la última sincronización del cliente.',
            },
            {
                method: 'POST', path: '/api/v1/sync/events', auth: true,
                summary: 'Recibir evento del sistema externo',
                description: 'Webhook para que el sistema externo notifique eventos a TuiStream.',
                requestBody: `{
  "event": "media.uploaded",
  "payload": { "file_id": 123, "title": "video.mp4" },
  "timestamp": "2026-06-10T12:00:00-05:00"
}`,
                responses: [
                    { code: 201, body: `{ "message": "Evento recibido correctamente.", "event": "media.uploaded", "received_at": "..." }` },
                ]
            },
        ],
    },
];

// ── Copiar al portapapeles ─────────────────────────────────────────────
function copyToClipboard(text: string, endpointPath: string) {
    navigator.clipboard.writeText(text);
    copiedEndpoint.value = endpointPath;
    setTimeout(() => { copiedEndpoint.value = ''; }, 2000);
}

// ── Método badge color ─────────────────────────────────────────────────
function methodColor(method: string) {
    switch (method) {
        case 'GET': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
        case 'POST': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
        case 'PUT': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
        case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
        default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
}

// ── Generar token (simulado — se conecta con API Sanctum) ──────────────
async function createToken() {
    if (!newTokenName.value.trim()) return;
    try {
        const { data } = await window.axios.post('/api/tokens', {
            name: newTokenName.value,
            abilities: newTokenAbilities.value,
        });
        tokenCreated.value = { name: newTokenName.value, token: data.token };
        newTokenName.value = '';
    } catch (e: any) {
        alert('Error: ' + (e.response?.data?.message || e.message));
    }
}

onMounted(() => {
    // Nada por ahora
});
</script>

<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Documentación de API</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                API RESTful para integración con sistemas externos. Autenticación vía Bearer Token (Laravel Sanctum).
            </p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Versión</p>
                <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">v1.0.0</p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Base URL</p>
                <p class="mt-1 text-sm font-mono font-semibold text-tuistream-600 dark:text-tuistream-400 break-all">/api/v1</p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rate Limit</p>
                <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">120 <span class="text-sm font-normal text-gray-400">req/min</span></p>
            </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
                v-for="tab in ['overview', 'endpoints', 'tokens']"
                :key="tab"
                @click="activeTab = (tab as any)"
                :class="[
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize',
                    activeTab === tab
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                ]"
            >
                {{ tab === 'overview' ? 'Guía Rápida' : tab === 'endpoints' ? 'Endpoints' : 'Tokens API' }}
            </button>
        </div>

        <!-- ─── TAB: Overview ─────────────────────────────────────────── -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
            <!-- Auth instructions -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-tuistream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Autenticación
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Todas las solicitudes a la API (excepto <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">/health</code>) requieren un token de API en el header:
                </p>
                <div class="relative">
                    <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-xl text-sm overflow-x-auto"><code>Authorization: Bearer TU_TOKEN_AQUI</code></pre>
                    <button
                        @click="copyToClipboard('Authorization: Bearer TU_TOKEN_AQUI', 'auth-header')"
                        class="absolute top-2 right-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg v-if="copiedEndpoint !== 'auth-header'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Quick examples -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Ejemplos rápidos</h2>

                <div class="space-y-4">
                    <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">cURL — Health Check</p>
                        <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-xl text-xs overflow-x-auto"><code>curl -X GET {{ typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com' }}/api/v1/health</code></pre>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">cURL — Listar estaciones</p>
                        <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-xl text-xs overflow-x-auto"><code>curl -X GET {{ typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com' }}/api/v1/stations \
  -H "Authorization: Bearer TU_TOKEN"</code></pre>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JavaScript / Fetch</p>
                        <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-xl text-xs overflow-x-auto"><code>const res = await fetch('/api/v1/stations', {
  headers: { 'Authorization': 'Bearer TU_TOKEN' }
});
const { data } = await res.json();
console.log(data);</code></pre>
                    </div>
                </div>
            </div>

            <!-- Response format -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Formato de respuesta</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Todas las respuestas exitosas envuelven los datos en la clave <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">data</code>. Las colecciones paginadas incluyen <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">pagination</code>.
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    Los errores siguen la estructura estándar de Laravel:
                </p>
                <pre class="bg-gray-900 dark:bg-gray-950 text-red-400 p-3 rounded-xl text-xs overflow-x-auto"><code>// 401 — No autenticado
{ "message": "Unauthenticated." }

// 404 — Recurso no encontrado o no autorizado
{ "message": "" }

// 429 — Rate limit excedido
{ "message": "Too Many Requests" }

// 422 — Error de validación
{ "message": "...", "errors": { "campo": ["Error"] } }</code></pre>
            </div>

            <!-- Security -->
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-2">
                <h2 class="text-lg font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Seguridad
                </h2>
                <ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc pl-5">
                    <li>Los tokens son personales e intransferibles. No los compartas.</li>
                    <li>Cada cliente solo puede acceder a sus propios recursos.</li>
                    <li>Toda actividad de API se registra en logs de auditoría.</li>
                    <li>Rate limit: 120 solicitudes por minuto por cliente.</li>
                    <li>Usa HTTPS en producción. Las conexiones HTTP serán rechazadas.</li>
                </ul>
            </div>
        </div>

        <!-- ─── TAB: Endpoints ─────────────────────────────────────────── -->
        <div v-if="activeTab === 'endpoints'" class="space-y-6">
            <div
                v-for="group in endpointGroups"
                :key="group.name"
                class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                <!-- Group header -->
                <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ group.name }}</h3>
                </div>

                <!-- Endpoints -->
                <div class="divide-y divide-gray-50 dark:divide-gray-800">
                    <div
                        v-for="(ep, i) in group.endpoints"
                        :key="i"
                        class="p-6 space-y-3 hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors"
                    >
                        <div class="flex items-start gap-3 flex-wrap">
                            <span
                                :class="[
                                    'px-2 py-0.5 text-xs font-bold rounded-md font-mono flex-shrink-0',
                                    methodColor(ep.method)
                                ]"
                            >{{ ep.method }}</span>
                            <code class="text-sm font-mono text-gray-900 dark:text-gray-200 break-all">{{ ep.path }}</code>
                            <span
                                v-if="ep.auth"
                                class="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md"
                            >Auth</span>
                            <span
                                v-else
                                class="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md"
                            >Público</span>
                            <button
                                @click="copyToClipboard(ep.path, ep.path)"
                                class="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                            >
                                <svg v-if="copiedEndpoint !== ep.path" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        </div>

                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ ep.summary }}</p>

                        <p v-if="ep.description" class="text-sm text-gray-500 dark:text-gray-400">{{ ep.description }}</p>

                        <!-- Query params -->
                        <div v-if="ep.queryParams?.length" class="space-y-1">
                            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Parámetros de consulta</p>
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs font-mono space-y-1">
                                <div v-for="qp in ep.queryParams" :key="qp.name" class="flex gap-3">
                                    <code class="text-tuistream-600 dark:text-tuistream-400">{{ qp.name }}</code>
                                    <span class="text-gray-400">{{ qp.type }}</span>
                                    <span class="text-gray-500">{{ qp.desc }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Request body -->
                        <div v-if="ep.requestBody" class="space-y-1">
                            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Body</p>
                            <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-xl text-xs overflow-x-auto"><code>{{ ep.requestBody }}</code></pre>
                        </div>

                        <!-- Responses -->
                        <div v-if="ep.responses?.length" class="space-y-2">
                            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Respuestas</p>
                            <div v-for="(r, j) in ep.responses" :key="j">
                                <p class="text-xs font-mono font-semibold mb-1" :class="r.code < 300 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ r.code }} {{ r.code < 300 ? 'OK' : r.code === 401 ? 'Unauthorized' : r.code === 404 ? 'Not Found' : 'Error' }}
                                </p>
                                <pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-3 rounded-xl text-xs overflow-x-auto"><code>{{ r.body }}</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── TAB: Tokens ────────────────────────────────────────────── -->
        <div v-if="activeTab === 'tokens'" class="space-y-6">
            <!-- Crear token -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Crear Token de API</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Los tokens permiten a un sistema externo autenticarse en la API. Cada token es único y debe almacenarse de forma segura.
                </p>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del token</label>
                        <input
                            v-model="newTokenName"
                            type="text"
                            placeholder="Ej: Sistema de Monitoreo"
                            class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-tuistream-500 focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permisos (abilities)</label>
                        <div class="flex flex-wrap gap-2">
                            <label
                                v-for="ab in ['read', 'write', 'sync']"
                                :key="ab"
                                class="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors"
                                :class="newTokenAbilities.includes(ab)
                                    ? 'bg-tuistream-50 dark:bg-tuistream-900/20 border-tuistream-300 dark:border-tuistream-700 text-tuistream-700 dark:text-tuistream-400'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'"
                            >
                                <input
                                    v-model="newTokenAbilities"
                                    type="checkbox"
                                    :value="ab"
                                    class="sr-only"
                                />
                                <div class="w-3.5 h-3.5 rounded border flex items-center justify-center"
                                    :class="newTokenAbilities.includes(ab) ? 'bg-tuistream-500 border-tuistream-500' : 'border-gray-300 dark:border-gray-600'"
                                >
                                    <svg v-if="newTokenAbilities.includes(ab)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span class="capitalize">{{ ab }}</span>
                            </label>
                        </div>
                    </div>

                    <button
                        @click="createToken"
                        :disabled="!newTokenName.trim()"
                        class="px-5 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors disabled:cursor-not-allowed"
                    >
                        Generar Token
                    </button>
                </div>

                <!-- Token recién creado -->
                <div
                    v-if="tokenCreated"
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2"
                >
                    <p class="text-sm font-semibold text-green-800 dark:text-green-400">Token generado: "{{ tokenCreated.name }}"</p>
                    <p class="text-xs text-green-700 dark:text-green-300">Copia este token ahora. <strong>No se mostrará de nuevo.</strong></p>
                    <div class="relative">
                        <pre class="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto"><code>{{ tokenCreated.token }}</code></pre>
                        <button
                            @click="copyToClipboard(tokenCreated.token, 'new-token')"
                            class="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg v-if="copiedEndpoint !== 'new-token'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <svg v-else class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Seguridad de tokens -->
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-2">
                <h3 class="font-semibold text-amber-800 dark:text-amber-400">Buenas prácticas</h3>
                <ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc pl-5">
                    <li>Asigna el mínimo de permisos necesarios (principio de menor privilegio).</li>
                    <li>Rota los tokens periódicamente y revoca los que ya no se usan.</li>
                    <li>Nunca incluyas tokens en código fuente o repositorios públicos.</li>
                    <li>Usa variables de entorno para almacenar tokens en producción.</li>
                </ul>
            </div>
        </div>
    </div>
</template>
