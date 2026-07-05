<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';
import { useStreamingStore } from '@/Stores/streamingStore';

interface MediaItem {
    id: number;
    original_name: string;
    duration: number | null;
    resolution: string | null;
    format: string;
}

interface VideoSchedule {
    id: number;
    media_id: number | null;
    title: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
    repeat_until: string | null;
    priority: number;
    is_active: boolean;
    media: MediaItem | null;
}

interface TvChannel {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    channel_type: string;
    is_active: boolean;
    is_public: boolean;
    hls_url: string | null;
    dash_url: string | null;
    rtmp_url: string | null;
    stream_key: string | null;
    current_viewers: number;
    peak_viewers: number;
    resolution: string | null;
    bitrate: number | null;
    current_program: string | null;
    auto_schedule_enabled: boolean;
    last_stream_started_at: string | null;
    schedules: VideoSchedule[];
}

interface ViewerPoint {
    viewers: number;
    connected_at: string;
}

const page = usePage();
const streaming = useStreamingStore();
const channelId = computed(() => Number(page.url.match(/\/client\/tv-channels\/(\d+)/)?.[1] || 0));

const weekDays = [
    { label: 'Dom', value: 0 },
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mie', value: 3 },
    { label: 'Jue', value: 4 },
    { label: 'Vie', value: 5 },
    { label: 'Sab', value: 6 },
];

const channel = ref<TvChannel | null>(null);
const videoLibrary = ref<MediaItem[]>([]);
const viewerStats = ref<ViewerPoint[]>([]);
const loading = ref(true);
const scheduleCreating = ref(false);
const channelSaving = ref(false);
const actionLoading = ref<'start' | 'stop' | null>(null);
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

const scheduleForm = ref({
    media_id: '',
    title: '',
    start_time: '',
    end_time: '',
    days_of_week: [1, 2, 3, 4, 5] as number[],
    repeat_until: '',
    priority: 10,
});

function showFeedback(type: 'success' | 'error', message: string) {
    feedback.value = { type, message };
    window.setTimeout(() => {
        if (feedback.value?.message === message) {
            feedback.value = null;
        }
    }, 4000);
}

function normalizeChannel(data: TvChannel): TvChannel {
    return {
        ...data,
        schedules: (data.schedules || []).map((schedule) => ({
            ...schedule,
            days_of_week: Array.isArray(schedule.days_of_week) ? schedule.days_of_week.map(Number) : [],
        })),
    };
}

async function fetchChannel() {
    const { data } = await axios.get(`/api/tv-channels/${channelId.value}`);
    channel.value = normalizeChannel(data);
}

async function fetchVideoLibrary() {
    const { data } = await axios.get('/api/media', { params: { type: 'video' } });
    videoLibrary.value = data.media?.data || data.media || [];
}

async function fetchViewerStats() {
    const { data } = await axios.get(`/api/stats/viewers/${channelId.value}`, {
        params: { period: '24h' },
    });
    viewerStats.value = Array.isArray(data) ? data : [];
}

async function fetchAll() {
    loading.value = true;
    try {
        await Promise.all([fetchChannel(), fetchVideoLibrary(), fetchViewerStats()]);
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible cargar la consola de Web TV.');
    } finally {
        loading.value = false;
    }
}

async function saveChannelConfig() {
    if (!channel.value) return;

    channelSaving.value = true;
    try {
        const { data } = await axios.put(`/api/tv-channels/${channel.value.id}`, {
            description: channel.value.description,
            resolution: channel.value.resolution,
            bitrate: channel.value.bitrate,
            is_public: channel.value.is_public,
            auto_schedule_enabled: channel.value.auto_schedule_enabled,
            current_program: channel.value.current_program,
        });
        channel.value = normalizeChannel(data);
        showFeedback('success', 'Configuracion del canal actualizada.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible guardar la configuracion.');
    } finally {
        channelSaving.value = false;
    }
}

async function controlChannel(action: 'start' | 'stop') {
    if (!channel.value) return;

    actionLoading.value = action;
    try {
        await axios.post(`/api/tv-channels/${channel.value.id}/${action}`);
        await Promise.all([fetchChannel(), fetchViewerStats()]);
        showFeedback('success', action === 'start' ? 'Transmision iniciada.' : 'Transmision detenida.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible ejecutar la accion.');
    } finally {
        actionLoading.value = null;
    }
}

async function createSchedule() {
    if (!channel.value || !scheduleForm.value.title.trim() || !scheduleForm.value.start_time || !scheduleForm.value.end_time) return;

    scheduleCreating.value = true;
    try {
        await axios.post(`/api/tv-channels/${channel.value.id}/schedules`, {
            media_id: scheduleForm.value.media_id ? Number(scheduleForm.value.media_id) : null,
            title: scheduleForm.value.title,
            start_time: scheduleForm.value.start_time,
            end_time: scheduleForm.value.end_time,
            days_of_week: scheduleForm.value.days_of_week,
            repeat_until: scheduleForm.value.repeat_until || null,
            priority: scheduleForm.value.priority,
            is_active: true,
        });
        scheduleForm.value = {
            media_id: '',
            title: '',
            start_time: '',
            end_time: '',
            days_of_week: [1, 2, 3, 4, 5],
            repeat_until: '',
            priority: 10,
        };
        await fetchChannel();
        showFeedback('success', 'Bloque de video programado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible crear el bloque.');
    } finally {
        scheduleCreating.value = false;
    }
}

async function toggleSchedule(schedule: VideoSchedule) {
    if (!channel.value) return;

    try {
        await axios.put(`/api/tv-channels/${channel.value.id}/schedules/${schedule.id}`, {
            is_active: !schedule.is_active,
        });
        schedule.is_active = !schedule.is_active;
        showFeedback('success', 'Estado del bloque actualizado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible actualizar el bloque.');
    }
}

async function deleteSchedule(schedule: VideoSchedule) {
    if (!channel.value) return;
    if (!confirm(`¿Eliminar el bloque "${schedule.title}"?`)) return;

    try {
        await axios.delete(`/api/tv-channels/${channel.value.id}/schedules/${schedule.id}`);
        channel.value.schedules = channel.value.schedules.filter((item) => item.id !== schedule.id);
        showFeedback('success', 'Bloque eliminado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible eliminar el bloque.');
    }
}

const viewerMax = computed(() => Math.max(1, ...viewerStats.value.map((point) => point.viewers), channel.value?.peak_viewers || 1));
const activeSchedules = computed(() => channel.value?.schedules.filter((schedule) => schedule.is_active) || []);

const ingestInfo = computed(() => {
    const url = channel.value?.rtmp_url || '';
    const index = url.lastIndexOf('/');
    if (index === -1) {
        return {
            server: url || 'No disponible',
            streamKey: channel.value?.stream_key || 'No disponible',
        };
    }

    return {
        server: url.slice(0, index),
        streamKey: channel.value?.stream_key || url.slice(index + 1),
    };
});

function typeLabel(type: string) {
    const labels: Record<string, string> = {
        tv_247: 'TV 24/7',
        web_tv: 'Web TV',
        visual_radio: 'Radio Visual',
        live_event: 'Evento en Vivo',
    };
    return labels[type] || type;
}

function formatDateTime(value: string | null) {
    if (!value) return 'Sin registro';
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function scheduleDaysLabel(days: number[]) {
    if (!days?.length) return 'Sin repeticion';
    if (days.length === 7) return 'Todos los dias';
    return days
        .slice()
        .sort((a, b) => a - b)
        .map((day) => weekDays.find((item) => item.value === day)?.label || day)
        .join(' · ');
}

function metricBar(value: number) {
    return `${Math.max(6, (value / viewerMax.value) * 100)}%`;
}

onMounted(() => {
    fetchAll();
    streaming.connect();
    refreshInterval.value = setInterval(() => {
        fetchChannel();
        fetchViewerStats();
    }, 15000);
});

onUnmounted(() => {
    if (refreshInterval.value) clearInterval(refreshInterval.value);
    streaming.disconnect();
});
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div class="flex items-start gap-3">
                    <Link href="/client/tv-channels" class="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel?.name || 'Web TV' }}</h2>
                            <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                {{ typeLabel(channel?.channel_type || 'web_tv') }}
                            </span>
                            <span :class="channel?.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium">
                                {{ channel?.is_active ? 'En vivo' : 'Offline' }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Consola Web TV para streaming en vivo y programado compatible con flujos RTMP, HLS y DASH.
                        </p>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2">
                    <button class="btn-primary !px-4" :disabled="actionLoading !== null" @click="controlChannel('start')">
                        {{ actionLoading === 'start' ? 'Iniciando...' : 'Iniciar stream' }}
                    </button>
                    <button class="btn-danger !px-4" :disabled="actionLoading !== null" @click="controlChannel('stop')">
                        {{ actionLoading === 'stop' ? 'Deteniendo...' : 'Detener stream' }}
                    </button>
                </div>
            </div>

            <div v-if="feedback" :class="feedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'" class="card !py-4">
                {{ feedback.message }}
            </div>

            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>

            <template v-else-if="channel">
                <div class="grid grid-cols-2 xl:grid-cols-5 gap-3">
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel.current_viewers || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Viewers actuales</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel.peak_viewers || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Pico de viewers</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ activeSchedules.length }}</p>
                        <p class="text-xs text-gray-400 mt-1">Bloques activos</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ videoLibrary.length }}</p>
                        <p class="text-xs text-gray-400 mt-1">Videos disponibles</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel.resolution || 'Auto' }}</p>
                        <p class="text-xs text-gray-400 mt-1">Resolucion</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div class="xl:col-span-2 space-y-6">
                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estado de emision y compatibilidad</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitorea el estado del canal y publica configuraciones listas para herramientas de produccion en vivo.</p>

                            <div class="grid lg:grid-cols-2 gap-4 mt-6">
                                <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4">
                                    <p class="text-xs uppercase tracking-wide text-gray-400">Programa actual</p>
                                    <p class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{{ channel.current_program || 'Sin programa activo' }}</p>
                                    <p class="mt-4 text-xs text-gray-400">
                                        Realtime {{ streaming.isConnected ? 'conectado' : 'en espera' }} · ultimo arranque {{ formatDateTime(channel.last_stream_started_at) }}
                                    </p>
                                </div>
                                <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4">
                                    <p class="text-xs uppercase tracking-wide text-gray-400">Salida de distribucion</p>
                                    <div class="space-y-2 mt-2 text-sm">
                                        <div>
                                            <p class="text-gray-400">HLS</p>
                                            <code class="text-gray-900 dark:text-white break-all">{{ channel.hls_url || 'No disponible' }}</code>
                                        </div>
                                        <div>
                                            <p class="text-gray-400">DASH</p>
                                            <code class="text-gray-900 dark:text-white break-all">{{ channel.dash_url || 'No disponible' }}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="grid lg:grid-cols-3 gap-4 mt-4">
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-xs text-gray-400">Servidor RTMP</p>
                                    <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white break-all">{{ ingestInfo.server }}</p>
                                </div>
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-xs text-gray-400">App / Stream Key</p>
                                    <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white break-all">{{ ingestInfo.streamKey }}</p>
                                </div>
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-xs text-gray-400">Codec recomendado</p>
                                    <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">H.264 + AAC</p>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Programacion de video</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Define la parrilla del canal para emisiones lineales, web TV o eventos programados.</p>

                            <div class="grid lg:grid-cols-2 gap-3 mt-6">
                                <input v-model="scheduleForm.title" type="text" class="input-field" placeholder="Nombre del bloque o programa" />
                                <select v-model="scheduleForm.media_id" class="input-field">
                                    <option value="">Video opcional de biblioteca</option>
                                    <option v-for="media in videoLibrary" :key="media.id" :value="String(media.id)">
                                        {{ media.original_name }} · {{ media.resolution || 'sin resolucion' }}
                                    </option>
                                </select>
                                <input v-model="scheduleForm.start_time" type="datetime-local" class="input-field" />
                                <input v-model="scheduleForm.end_time" type="datetime-local" class="input-field" />
                                <input v-model="scheduleForm.repeat_until" type="datetime-local" class="input-field" />
                                <input v-model.number="scheduleForm.priority" type="number" min="0" max="100" class="input-field" placeholder="Prioridad" />
                            </div>

                            <div class="flex flex-wrap gap-2 mt-4">
                                <label v-for="day in weekDays" :key="day.value" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
                                    <input v-model="scheduleForm.days_of_week" :value="day.value" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    {{ day.label }}
                                </label>
                            </div>

                            <button class="btn-primary mt-4" :disabled="scheduleCreating" @click="createSchedule">
                                {{ scheduleCreating ? 'Guardando bloque...' : 'Agregar bloque a la parrilla' }}
                            </button>

                            <div class="space-y-3 mt-6">
                                <div v-if="!channel.schedules.length" class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
                                    No hay bloques programados para este canal.
                                </div>

                                <div v-for="schedule in channel.schedules" :key="schedule.id" class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div>
                                            <div class="flex flex-wrap items-center gap-2">
                                                <p class="font-medium text-gray-900 dark:text-white">{{ schedule.title }}</p>
                                                <span :class="schedule.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'" class="px-2 py-1 rounded-full text-xs">
                                                    {{ schedule.is_active ? 'Activo' : 'Pausado' }}
                                                </span>
                                            </div>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {{ formatDateTime(schedule.start_time) }} a {{ formatDateTime(schedule.end_time) }}
                                            </p>
                                            <p class="text-xs text-gray-400 mt-1">
                                                {{ scheduleDaysLabel(schedule.days_of_week) }} · prioridad {{ schedule.priority }}
                                            </p>
                                            <p class="text-xs text-gray-400 mt-1">
                                                Asset: {{ schedule.media?.original_name || 'Fuente externa / vivo' }}
                                            </p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button class="btn-secondary !px-4" @click="toggleSchedule(schedule)">
                                                {{ schedule.is_active ? 'Pausar' : 'Reactivar' }}
                                            </button>
                                            <button class="btn-danger !px-4" @click="deleteSchedule(schedule)">Eliminar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Compatibilidad de ingesta</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configuraciones homologadas para herramientas de produccion de video en vivo.</p>

                            <div class="grid lg:grid-cols-3 gap-4 mt-6">
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="font-semibold text-gray-900 dark:text-white">OBS Studio</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Modo "Custom..." con servidor RTMP y stream key dedicados.</p>
                                    <code class="block mt-3 text-xs text-gray-900 dark:text-white break-all">{{ ingestInfo.server }}</code>
                                </div>
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="font-semibold text-gray-900 dark:text-white">vMix</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Compatible con salida RTMP, presets H.264/AAC y control de bitrate.</p>
                                    <code class="block mt-3 text-xs text-gray-900 dark:text-white break-all">{{ ingestInfo.streamKey }}</code>
                                </div>
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="font-semibold text-gray-900 dark:text-white">Wirecast / similares</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Publicacion via RTMP ingest con reproduccion cliente final por HLS y DASH.</p>
                                    <code class="block mt-3 text-xs text-gray-900 dark:text-white break-all">{{ channel.rtmp_url || 'No disponible' }}</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Viewers y salud</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Seguimiento de audiencia y sincronizacion de estado del stream.</p>

                            <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4 mt-6">
                                <div class="flex items-end gap-2 h-24">
                                    <div v-for="(point, index) in viewerStats.slice(-12)" :key="index" class="flex-1 flex flex-col justify-end">
                                        <div class="bg-blue-500 rounded-t-md min-h-1" :style="{ height: metricBar(point.viewers) }" />
                                    </div>
                                </div>
                                <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
                                    <span>Ultimas 12 muestras</span>
                                    <span>Max {{ viewerMax }}</span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3 mt-4">
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-xs text-gray-400">Bitrate</p>
                                    <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ channel.bitrate || 0 }} kbps</p>
                                </div>
                                <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-xs text-gray-400">Salida</p>
                                    <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ channel.is_public ? 'Publica' : 'Privada' }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Control centralizado</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajusta el perfil tecnico del canal y la automatizacion de video.</p>

                            <div class="space-y-3 mt-6">
                                <textarea v-model="channel.description" rows="3" class="input-field" placeholder="Descripcion operativa del canal" />
                                <input v-model="channel.current_program" type="text" class="input-field" placeholder="Programa actual / fallback" />
                                <input v-model="channel.resolution" type="text" class="input-field" placeholder="1920x1080" />
                                <input v-model.number="channel.bitrate" type="number" min="500" class="input-field" placeholder="Bitrate kbps" />
                                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <input v-model="channel.auto_schedule_enabled" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    Programacion automatica habilitada
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <input v-model="channel.is_public" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    Canal publico
                                </label>
                                <button class="btn-primary w-full" :disabled="channelSaving" @click="saveChannelConfig">
                                    {{ channelSaving ? 'Guardando...' : 'Guardar configuracion del canal' }}
                                </button>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Checklist de estabilidad</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Puntos de verificacion rapida para la operacion del stream.</p>

                            <div class="space-y-3 mt-6">
                                <div class="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">RTMP de ingesta</span>
                                    <span :class="channel.rtmp_url ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="text-sm font-semibold">
                                        {{ channel.rtmp_url ? 'Listo' : 'Pendiente' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Salida HLS</span>
                                    <span :class="channel.hls_url ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="text-sm font-semibold">
                                        {{ channel.hls_url ? 'Listo' : 'Pendiente' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Salida DASH</span>
                                    <span :class="channel.dash_url ? 'text-green-600 dark:text-green-400' : 'text-red-500'" class="text-sm font-semibold">
                                        {{ channel.dash_url ? 'Listo' : 'Pendiente' }}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">Sincronizacion realtime</span>
                                    <span :class="streaming.isConnected ? 'text-green-600 dark:text-green-400' : 'text-amber-500'" class="text-sm font-semibold">
                                        {{ streaming.isConnected ? 'Conectada' : 'En espera' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </AuthenticatedLayout>
</template>
