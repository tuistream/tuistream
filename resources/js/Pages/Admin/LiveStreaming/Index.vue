<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

declare const axios: any;

interface LiveStream {
    id: number;
    name: string;
    channel_type: string;
    client: { id: number; name: string } | null;
    is_active: boolean;
    rtmp_url: string | null;
    hls_url: string | null;
    dash_url: string | null;
    stream_key: string | null;
    current_viewers: number;
    peak_viewers: number;
    current_program: string | null;
    resolution: string | null;
    bitrate: number | null;
    last_stream_started_at: string | null;
}

const streams = ref<LiveStream[]>([]);
const loading = ref(true);
const error = ref('');
const actionLoading = ref<number | null>(null);
const copiedKey = ref<number | null>(null);
const showStreamKey = ref<number | null>(null);

const activeStreams = computed(() => streams.value.filter(s => s.is_active));
const totalViewers = computed(() => streams.value.reduce((sum, s) => sum + (s.current_viewers || 0), 0));
const peakViewers = computed(() => {
    if (!streams.value.length) return 0;
    return Math.max(...streams.value.map(s => s.peak_viewers || 0));
});
const rtmpServerUrl = computed(() => {
    if (typeof window === 'undefined') return 'rtmp://tu-server:1935/live';
    return 'rtmp://' + (new URL(window.location.href)).hostname + ':1935/live';
});

function streamHealth(stream: LiveStream) {
    if (!stream.is_active) return { label: 'Detenido', color: 'bg-gray-500', pulse: false };
    if (stream.current_viewers > 0) return { label: 'Saludable', color: 'bg-green-500', pulse: true };
    return { label: 'Sin viewers', color: 'bg-yellow-500', pulse: true };
}

function channelTypeLabel(type: string) {
    const map: Record<string, string> = {
        tv_247: 'TV 24/7',
        web_tv: 'Web TV',
        visual_radio: 'Radio Visual',
        live_event: 'Evento en Vivo',
    };
    return map[type] || type;
}

async function fetchStreams() {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get('/api/tv-channels');
        streams.value = data;
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar los streams';
    } finally {
        loading.value = false;
    }
}

async function toggleStream(stream: LiveStream) {
    actionLoading.value = stream.id;
    error.value = '';
    try {
        if (stream.is_active) {
            await axios.post(`/api/tv-channels/${stream.id}/stop`);
        } else {
            await axios.post(`/api/tv-channels/${stream.id}/start`);
        }
        await fetchStreams();
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cambiar estado del stream';
    } finally {
        actionLoading.value = null;
    }
}

function copyToClipboard(text: string, id: number) {
    navigator.clipboard.writeText(text);
    copiedKey.value = id;
    setTimeout(() => copiedKey.value = null, 2000);
}

onMounted(fetchStreams);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Live Streaming</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitoreo y gestión de transmisiones en vivo</p>
                </div>
                <Link
                    href="/admin/tv-channels/create"
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Stream
                </Link>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Streams Activos</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ activeStreams.length }}</p>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Viewers Totales</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ totalViewers }}</p>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Total Canales</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ streams.length }}</p>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Peak Viewers</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ peakViewers }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
                <button @click="error = ''" class="ml-auto p-1 text-red-400 hover:text-red-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-3">
                    <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span class="text-sm text-gray-400">Cargando streams...</span>
                </div>
            </div>

            <!-- Streams List -->
            <div v-else class="space-y-4">
                <div v-if="!streams.length" class="card flex flex-col items-center justify-center py-16 text-center">
                    <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No hay streams configurados</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Crea tu primer canal de streaming en vivo</p>
                </div>

                <div v-for="stream in streams" :key="stream.id" class="card space-y-4">
                    <!-- Stream Header -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ stream.name }}</h3>
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs">
                                        <span :class="streamHealth(stream).color" class="w-1.5 h-1.5 rounded-full" :class="{ 'animate-pulse': streamHealth(stream).pulse }" />
                                        <span :class="stream.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'" class="font-medium">{{ streamHealth(stream).label }}</span>
                                    </span>
                                </div>
                                <div class="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                    <span>{{ channelTypeLabel(stream.channel_type) }}</span>
                                    <span v-if="stream.client">· {{ stream.client.name }}</span>
                                    <span v-if="stream.resolution">· {{ stream.resolution }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <Link
                                :href="`/admin/tv-channels/${stream.id}`"
                                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Editar
                            </Link>
                            <button
                                @click="toggleStream(stream)"
                                :disabled="actionLoading === stream.id"
                                :class="[
                                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50',
                                    stream.is_active
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                                ]"
                            >
                                <span v-if="actionLoading === stream.id" class="flex items-center gap-1">
                                    <svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Procesando
                                </span>
                                <span v-else>{{ stream.is_active ? 'Detener' : 'Iniciar' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Stream Details -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- RTMP / SRT Input -->
                        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entrada RTMP/SRT</h4>
                            <div class="space-y-2">
                                <div>
                                    <p class="text-xs text-gray-400 mb-1">RTMP URL</p>
                                    <div class="flex items-center gap-2">
                                        <code class="flex-1 text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate">{{ stream.rtmp_url || 'No configurado' }}</code>
                                        <button
                                            v-if="stream.rtmp_url"
                                            @click="copyToClipboard(stream.rtmp_url, stream.id)"
                                            class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                                        >
                                            <svg v-if="copiedKey === stream.id" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 mb-1">Stream Key</p>
                                    <div class="flex items-center gap-2">
                                        <code class="flex-1 text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate">
                                            {{ showStreamKey === stream.id ? stream.stream_key : '••••••••••••••••' }}
                                        </code>
                                        <button
                                            @click="showStreamKey = showStreamKey === stream.id ? null : stream.id"
                                            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                                        >
                                            <svg v-if="showStreamKey === stream.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Output -->
                        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Salida de Streaming</h4>
                            <div class="space-y-2">
                                <div>
                                    <p class="text-xs text-gray-400 mb-1">HLS URL</p>
                                    <code class="block text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate">{{ stream.hls_url || 'No disponible' }}</code>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400 mb-1">DASH URL</p>
                                    <code class="block text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate">{{ stream.dash_url || 'No disponible' }}</code>
                                </div>
                            </div>
                        </div>

                        <!-- Metrics -->
                        <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
                            <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Métricas</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <p class="text-xs text-gray-400">Viewers</p>
                                    <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stream.current_viewers || 0 }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400">Pico</p>
                                    <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stream.peak_viewers || 0 }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400">Resolución</p>
                                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ stream.resolution || '—' }}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-400">Bitrate</p>
                                    <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ stream.bitrate ? stream.bitrate + ' Kbps' : '—' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Current Program -->
                    <div v-if="stream.current_program" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-tuistream-50 dark:bg-tuistream-900/20">
                        <svg class="w-4 h-4 text-tuistream-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span class="text-sm text-tuistream-700 dark:text-tuistream-300 font-medium">En vivo: {{ stream.current_program }}</span>
                    </div>
                </div>
            </div>

            <!-- RTMP/SRT Configuration Info -->
            <div class="card">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Configuración de Entrada RTMP/SRT</h3>
                <div class="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-400">
                    <p class="text-sm">Para transmitir a este servidor, configura tu software de streaming (OBS, vMix, Wirecast) con los siguientes parámetros:</p>
                    <ul class="text-sm space-y-1 mt-2">
                        <li><strong>Servicio:</strong> Servidor personalizado (Custom RTMP)</li>
                        <li><strong>Servidor RTMP:</strong> <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">{{ rtmpServerUrl }}</code></li>
                        <li><strong>Stream Key:</strong> La clave generada para cada canal</li>
                        <li><strong>Codec de video recomendado:</strong> H.264, 1080p, 4000-8000 Kbps</li>
                        <li><strong>Codec de audio recomendado:</strong> AAC, 128 Kbps</li>
                    </ul>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
