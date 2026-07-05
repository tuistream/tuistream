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
    format: string;
    size: number;
    pivot?: {
        order: number;
        weight: number;
        cue_in: number | null;
        cue_out: number | null;
    };
}

interface PlaylistSchedule {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    days_of_week: number[];
    priority: number;
    is_active: boolean;
}

interface Playlist {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    is_jingle_playlist: boolean;
    playback_order: 'sequential' | 'random' | 'weighted';
    crossfade_duration: number;
    media: MediaItem[];
    schedules: PlaylistSchedule[];
}

interface SongHistoryItem {
    id: number;
    title: string;
    artist: string | null;
    played_at: string;
    listeners_at_time: number;
}

interface Station {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    genre: string | null;
    website_url: string | null;
    is_active: boolean;
    is_public: boolean;
    stream_url: string | null;
    stream_ssl_url: string | null;
    max_listeners: number;
    bitrate: number;
    audio_format: string;
    auto_dj_enabled: boolean;
    auto_dj_status: string | null;
    current_song: string | null;
    current_listeners: number;
    peak_listeners: number;
    mount_point: string | null;
    source_password: string | null;
    admin_password: string | null;
    last_stream_started_at: string | null;
    playlists: Playlist[];
    song_history: SongHistoryItem[];
}

interface ListenerPoint {
    listeners: number;
    connected_at: string;
}

const page = usePage();
const streaming = useStreamingStore();
const stationId = computed(() => Number(page.url.match(/\/client\/stations\/(\d+)/)?.[1] || 0));

const weekDays = [
    { label: 'Dom', value: 0 },
    { label: 'Lun', value: 1 },
    { label: 'Mar', value: 2 },
    { label: 'Mie', value: 3 },
    { label: 'Jue', value: 4 },
    { label: 'Vie', value: 5 },
    { label: 'Sab', value: 6 },
];

const station = ref<Station | null>(null);
const audioLibrary = ref<MediaItem[]>([]);
const listenerStats = ref<ListenerPoint[]>([]);
const loading = ref(true);
const libraryLoading = ref(false);
const actionLoading = ref<'start' | 'stop' | 'restart' | null>(null);
const stationSaving = ref(false);
const playlistCreating = ref(false);
const scheduleCreating = ref(false);
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const playlistMediaSelection = ref<Record<number, string>>({});
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

const playlistForm = ref({
    name: '',
    description: '',
    playback_order: 'sequential',
    crossfade_duration: 4,
    is_jingle_playlist: false,
});

const scheduleForm = ref({
    playlist_id: '',
    name: '',
    start_time: '08:00',
    end_time: '10:00',
    days_of_week: [1, 2, 3, 4, 5] as number[],
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

function normalizeStation(data: any): Station {
    return {
        ...data,
        // Handle both camelCase (Laravel) and snake_case naming
        song_history: Array.isArray(data.song_history)
            ? data.song_history
            : Array.isArray(data.songHistory)
                ? data.songHistory
                : [],
        playlists: (data.playlists || []).map((playlist: any) => ({
            ...playlist,
            media: Array.isArray(playlist.media) ? playlist.media : [],
            schedules: (playlist.schedules || []).map((schedule: any) => ({
                ...schedule,
                // days_of_week might come as JSON string from backend
                days_of_week: parseDaysOfWeek(schedule.days_of_week),
            })),
        })),
    };
}

function parseDaysOfWeek(raw: any): number[] {
    if (Array.isArray(raw)) {
        return raw.map(Number);
    }
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch {
            return [];
        }
    }
    return [];
}

async function fetchStation() {
    try {
        const { data } = await axios.get(`/api/stations/${stationId.value}`);
        station.value = normalizeStation(data);
    } catch (error: any) {
        // Don't propagate — station will stay null, UI shows empty state
        console.warn('[AutoDJ] No se pudo cargar la estacion:', error?.message);
    }
}

async function fetchAudioLibrary() {
    libraryLoading.value = true;
    try {
        const { data } = await axios.get('/api/media', { params: { type: 'audio' } });
        audioLibrary.value = data.media?.data || data.media || [];
    } catch (error: any) {
        console.warn('[AutoDJ] No se pudo cargar la biblioteca:', error?.message);
        audioLibrary.value = [];
    } finally {
        libraryLoading.value = false;
    }
}

async function fetchListenerStats() {
    try {
        const { data } = await axios.get(`/api/stats/listeners/${stationId.value}`, {
            params: { period: '24h' },
        });
        listenerStats.value = Array.isArray(data) ? data : [];
    } catch (error: any) {
        console.warn('[AutoDJ] No se pudieron cargar estadisticas:', error?.message);
        listenerStats.value = [];
    }
}

async function fetchAll() {
    loading.value = true;
    // Each fetch handles its own errors independently so one failure doesn't block others
    await Promise.allSettled([
        fetchStation(),
        fetchAudioLibrary(),
        fetchListenerStats(),
    ]);
    loading.value = false;
}

async function saveStationConfig() {
    if (!station.value) return;

    stationSaving.value = true;
    try {
        const { data } = await axios.put(`/api/stations/${station.value.id}`, {
            bitrate: station.value.bitrate,
            audio_format: station.value.audio_format,
            max_listeners: station.value.max_listeners,
            auto_dj_enabled: station.value.auto_dj_enabled,
            is_public: station.value.is_public,
            mount_point: station.value.mount_point,
            website_url: station.value.website_url,
            description: station.value.description,
        });
        station.value = normalizeStation(data);
        showFeedback('success', 'Configuracion AutoDJ actualizada.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible guardar la configuracion.');
    } finally {
        stationSaving.value = false;
    }
}

async function controlAutoDj(action: 'start' | 'stop' | 'restart') {
    if (!station.value) return;

    actionLoading.value = action;
    try {
        await axios.post(`/api/stations/${station.value.id}/${action}`);
        await Promise.all([fetchStation(), fetchListenerStats()]);
        showFeedback('success', `Accion "${action}" ejecutada correctamente.`);
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible ejecutar la accion solicitada.');
    } finally {
        actionLoading.value = null;
    }
}

async function createPlaylist() {
    if (!station.value || !playlistForm.value.name.trim()) return;

    playlistCreating.value = true;
    try {
        await axios.post('/api/playlists', {
            station_id: station.value.id,
            name: playlistForm.value.name,
            description: playlistForm.value.description || null,
            playback_order: playlistForm.value.playback_order,
            crossfade_duration: playlistForm.value.crossfade_duration,
            is_jingle_playlist: playlistForm.value.is_jingle_playlist,
        });
        playlistForm.value = {
            name: '',
            description: '',
            playback_order: 'sequential',
            crossfade_duration: 4,
            is_jingle_playlist: false,
        };
        await fetchStation();
        showFeedback('success', 'Playlist creada correctamente.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible crear la playlist.');
    } finally {
        playlistCreating.value = false;
    }
}

async function savePlaylist(playlist: Playlist) {
    try {
        const { data } = await axios.put(`/api/playlists/${playlist.id}`, {
            name: playlist.name,
            description: playlist.description,
            playback_order: playlist.playback_order,
            crossfade_duration: playlist.crossfade_duration,
            is_active: playlist.is_active,
            is_jingle_playlist: playlist.is_jingle_playlist,
        });

        if (station.value) {
            station.value.playlists = station.value.playlists.map((item) => item.id === playlist.id ? { ...playlist, ...data } : item);
        }

        await fetchStation();
        showFeedback('success', `Playlist "${playlist.name}" actualizada.`);
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible actualizar la playlist.');
    }
}

async function deletePlaylist(playlist: Playlist) {
    if (!confirm(`¿Eliminar la playlist "${playlist.name}"?`)) return;

    try {
        await axios.delete(`/api/playlists/${playlist.id}`);
        if (station.value) {
            station.value.playlists = station.value.playlists.filter((item) => item.id !== playlist.id);
        }
        showFeedback('success', 'Playlist eliminada.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible eliminar la playlist.');
    }
}

async function addTrackToPlaylist(playlist: Playlist) {
    const selected = Number(playlistMediaSelection.value[playlist.id] || 0);
    if (!selected) return;

    try {
        await axios.post(`/api/playlists/${playlist.id}/media`, { media_id: selected });
        playlistMediaSelection.value[playlist.id] = '';
        await fetchStation();
        showFeedback('success', `Track agregado a "${playlist.name}".`);
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible agregar el track.');
    }
}

async function removeTrackFromPlaylist(playlist: Playlist, media: MediaItem) {
    try {
        await axios.delete(`/api/playlists/${playlist.id}/media/${media.id}`);
        await fetchStation();
        showFeedback('success', 'Track removido de la playlist.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible remover el track.');
    }
}

async function createSchedule() {
    if (!scheduleForm.value.playlist_id || !scheduleForm.value.name.trim()) return;

    scheduleCreating.value = true;
    try {
        await axios.post(`/api/playlists/${scheduleForm.value.playlist_id}/schedules`, {
            name: scheduleForm.value.name,
            start_time: scheduleForm.value.start_time,
            end_time: scheduleForm.value.end_time,
            days_of_week: scheduleForm.value.days_of_week,
            priority: scheduleForm.value.priority,
            is_active: true,
        });
        scheduleForm.value.name = '';
        await fetchStation();
        showFeedback('success', 'Bloque horario creado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible crear el bloque horario.');
    } finally {
        scheduleCreating.value = false;
    }
}

async function toggleSchedule(playlist: Playlist, schedule: PlaylistSchedule) {
    try {
        await axios.put(`/api/playlists/${playlist.id}/schedules/${schedule.id}`, {
            is_active: !schedule.is_active,
        });
        schedule.is_active = !schedule.is_active;
        showFeedback('success', 'Estado del bloque actualizado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible actualizar el bloque.');
    }
}

async function deleteSchedule(playlist: Playlist, schedule: PlaylistSchedule) {
    try {
        await axios.delete(`/api/playlists/${playlist.id}/schedules/${schedule.id}`);
        await fetchStation();
        showFeedback('success', 'Bloque horario eliminado.');
    } catch (error: any) {
        showFeedback('error', error?.response?.data?.message || 'No fue posible eliminar el bloque.');
    }
}

const totalTracks = computed(() => station.value?.playlists.reduce((total, playlist) => total + playlist.media.length, 0) || 0);
const activePlaylists = computed(() => station.value?.playlists.filter((playlist) => playlist.is_active) || []);
const activeSchedules = computed(() => station.value?.playlists.flatMap((playlist) => playlist.schedules.filter((schedule) => schedule.is_active)) || []);
const jinglePlaylists = computed(() => station.value?.playlists.filter((playlist) => playlist.is_jingle_playlist).length || 0);
const listenerMax = computed(() => Math.max(1, ...listenerStats.value.map((point) => point.listeners), station.value?.peak_listeners || 1));

const flattenedSchedules = computed(() => {
    if (!station.value) return [];

    return station.value.playlists.flatMap((playlist) =>
        playlist.schedules.map((schedule) => ({
            ...schedule,
            playlist_id: playlist.id,
            playlist_name: playlist.name,
            is_jingle_playlist: playlist.is_jingle_playlist,
        })),
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));
});

function formatDuration(seconds: number | null) {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDateTime(value: string | null) {
    if (!value) return 'Sin registro';
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function formatClock(value: string) {
    return value.slice(0, 5);
}

function scheduleDaysLabel(days: number[]) {
    if (!days?.length) return 'Sin dias';
    if (days.length === 7) return 'Todos los dias';
    return days
        .slice()
        .sort((a, b) => a - b)
        .map((day) => weekDays.find((item) => item.value === day)?.label || day)
        .join(' · ');
}

function audienceBar(value: number) {
    return `${Math.max(6, (value / listenerMax.value) * 100)}%`;
}

onMounted(() => {
    fetchAll();
    streaming.connect();
    refreshInterval.value = setInterval(() => {
        fetchStation();
        fetchListenerStats();
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
                    <Link href="/client/stations" class="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ station?.name || 'AutoDJ' }}</h2>
                            <span :class="station?.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium">
                                {{ station?.is_active ? 'En vivo' : 'Offline' }}
                            </span>
                            <span :class="streaming.isConnected ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'" class="px-2.5 py-1 rounded-full text-xs font-medium">
                                {{ streaming.isConnected ? 'Realtime conectado' : 'Realtime en espera' }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Consola AutoDJ para gestionar bloques musicales, transiciones y supervision de emision.
                        </p>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2">
                    <button class="btn-secondary !px-4" :disabled="actionLoading !== null" @click="controlAutoDj('start')">
                        {{ actionLoading === 'start' ? 'Iniciando...' : 'Iniciar AutoDJ' }}
                    </button>
                    <button class="btn-secondary !px-4" :disabled="actionLoading !== null" @click="controlAutoDj('restart')">
                        {{ actionLoading === 'restart' ? 'Reiniciando...' : 'Reiniciar' }}
                    </button>
                    <button class="btn-danger !px-4" :disabled="actionLoading !== null" @click="controlAutoDj('stop')">
                        {{ actionLoading === 'stop' ? 'Deteniendo...' : 'Detener' }}
                    </button>
                </div>
            </div>

            <div v-if="feedback" :class="feedback.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'" class="card !py-4">
                {{ feedback.message }}
            </div>

            <div v-if="loading" class="card flex flex-col items-center justify-center py-16 gap-3">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                <p class="text-sm text-gray-400">Cargando consola AutoDJ...</p>
            </div>

            <template v-else-if="station">
                <div class="grid grid-cols-2 xl:grid-cols-5 gap-3">
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ station.current_listeners || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Oyentes actuales</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ station.peak_listeners || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Pico de audiencia</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ activePlaylists.length }}</p>
                        <p class="text-xs text-gray-400 mt-1">Playlists activas</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ activeSchedules.length }}</p>
                        <p class="text-xs text-gray-400 mt-1">Bloques programados</p>
                    </div>
                    <div class="card text-center py-5">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTracks }}</p>
                        <p class="text-xs text-gray-400 mt-1">Tracks cargados</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div class="xl:col-span-2 space-y-6">
                        <div class="card">
                            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Estado de transmision</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Supervisa la emision, las URLs de distribucion y el contenido al aire.</p>
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    Ultimo arranque: <span class="text-gray-900 dark:text-white">{{ formatDateTime(station.last_stream_started_at) }}</span>
                                </div>
                            </div>

                            <div class="grid md:grid-cols-2 gap-4 mt-6">
                                <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80">
                                    <p class="text-xs uppercase tracking-wide text-gray-400">Cancion actual</p>
                                    <p class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{{ station.current_song || 'Sin audio al aire' }}</p>
                                    <p class="mt-4 text-xs text-gray-400">AutoDJ {{ station.auto_dj_enabled ? 'habilitado' : 'deshabilitado' }} · Estado {{ station.auto_dj_status || 'idle' }}</p>
                                </div>
                                <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80">
                                    <p class="text-xs uppercase tracking-wide text-gray-400">Distribucion</p>
                                    <div class="mt-2 space-y-2 text-sm">
                                        <div>
                                            <p class="text-gray-400">Stream URL</p>
                                            <code class="text-gray-900 dark:text-white break-all">{{ station.stream_url || 'No configurada' }}</code>
                                        </div>
                                        <div>
                                            <p class="text-gray-400">SSL URL</p>
                                            <code class="text-gray-900 dark:text-white break-all">{{ station.stream_ssl_url || 'No configurada' }}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="grid md:grid-cols-3 gap-4 mt-4 text-sm">
                                <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p class="text-gray-400">Montaje</p>
                                    <p class="mt-2 font-medium text-gray-900 dark:text-white">{{ station.mount_point || '/stream' }}</p>
                                </div>
                                <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p class="text-gray-400">Password fuente</p>
                                    <p class="mt-2 font-medium text-gray-900 dark:text-white">{{ station.source_password || 'No disponible' }}</p>
                                </div>
                                <div class="p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p class="text-gray-400">Formato</p>
                                    <p class="mt-2 font-medium uppercase text-gray-900 dark:text-white">{{ station.audio_format }} · {{ station.bitrate }} kbps</p>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Playlists y bloques musicales</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra las listas de reproduccion, jingles y la composicion automatica de la emision.</p>
                                </div>
                                <span class="text-sm text-gray-400">{{ libraryLoading ? 'Actualizando biblioteca...' : `${audioLibrary.length} archivos de audio disponibles` }}</span>
                            </div>

                            <div class="grid lg:grid-cols-5 gap-3 mt-6">
                                <input v-model="playlistForm.name" type="text" placeholder="Nombre de playlist" class="input-field lg:col-span-2" />
                                <input v-model="playlistForm.description" type="text" placeholder="Descripcion operativa" class="input-field lg:col-span-2" />
                                <button class="btn-primary" :disabled="playlistCreating" @click="createPlaylist">
                                    {{ playlistCreating ? 'Creando...' : 'Crear playlist' }}
                                </button>
                                <select v-model="playlistForm.playback_order" class="input-field">
                                    <option value="sequential">Secuencial</option>
                                    <option value="random">Aleatoria</option>
                                    <option value="weighted">Ponderada</option>
                                </select>
                                <input v-model.number="playlistForm.crossfade_duration" min="0" max="30" type="number" class="input-field" placeholder="Crossfade" />
                                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <input v-model="playlistForm.is_jingle_playlist" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    Playlist de jingles
                                </label>
                            </div>

                            <div class="space-y-5 mt-6">
                                <div v-if="!station.playlists.length" class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
                                    No hay playlists creadas. Empieza definiendo bloques musicales para el AutoDJ.
                                </div>

                                <div v-for="playlist in station.playlists" :key="playlist.id" class="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    <div class="p-5 bg-gray-50/70 dark:bg-gray-800/40">
                                        <div class="flex flex-col lg:flex-row gap-3">
                                            <input v-model="playlist.name" type="text" class="input-field lg:flex-1" />
                                            <select v-model="playlist.playback_order" class="input-field lg:w-44">
                                                <option value="sequential">Secuencial</option>
                                                <option value="random">Aleatoria</option>
                                                <option value="weighted">Ponderada</option>
                                            </select>
                                            <input v-model.number="playlist.crossfade_duration" type="number" min="0" max="30" class="input-field lg:w-36" />
                                            <button class="btn-secondary !px-4" @click="savePlaylist(playlist)">Guardar</button>
                                            <button class="btn-danger !px-4" @click="deletePlaylist(playlist)">Eliminar</button>
                                        </div>
                                        <div class="grid lg:grid-cols-5 gap-3 mt-3">
                                            <input v-model="playlist.description" type="text" class="input-field lg:col-span-3" placeholder="Descripcion de la playlist" />
                                            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <input v-model="playlist.is_active" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                                Activa
                                            </label>
                                            <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <input v-model="playlist.is_jingle_playlist" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                                Jingle/ID
                                            </label>
                                        </div>
                                        <div class="grid lg:grid-cols-[1fr_auto] gap-3 mt-4">
                                            <select v-model="playlistMediaSelection[playlist.id]" class="input-field">
                                                <option value="">Agregar audio desde biblioteca</option>
                                                <option v-for="media in audioLibrary" :key="media.id" :value="String(media.id)">
                                                    {{ media.original_name }} · {{ formatDuration(media.duration) }}
                                                </option>
                                            </select>
                                            <button class="btn-primary !px-4" @click="addTrackToPlaylist(playlist)">Agregar track</button>
                                        </div>
                                    </div>

                                    <div class="p-5">
                                        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
                                            <span>{{ playlist.media.length }} tracks</span>
                                            <span>•</span>
                                            <span>Crossfade {{ playlist.crossfade_duration }}s</span>
                                            <span>•</span>
                                            <span>{{ playlist.schedules.length }} bloques</span>
                                        </div>

                                        <div v-if="playlist.media.length" class="space-y-2">
                                            <div v-for="media in playlist.media" :key="`${playlist.id}-${media.id}`" class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3">
                                                <div class="min-w-0">
                                                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {{ media.pivot?.order ?? 0 }}. {{ media.original_name }}
                                                    </p>
                                                    <p class="text-xs text-gray-400">
                                                        {{ media.format.toUpperCase() }} · {{ formatDuration(media.duration) }} · peso {{ media.pivot?.weight ?? 1 }}
                                                    </p>
                                                </div>
                                                <button class="text-sm text-red-500 hover:text-red-600" @click="removeTrackFromPlaylist(playlist, media)">Quitar</button>
                                            </div>
                                        </div>
                                        <div v-else class="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-sm text-gray-400 text-center">
                                            Esta playlist aun no tiene audio asociado.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Programacion automatica</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea bloques horarios para automatizar la parrilla musical de la emisora.</p>

                            <div class="grid lg:grid-cols-5 gap-3 mt-6">
                                <select v-model="scheduleForm.playlist_id" class="input-field lg:col-span-2">
                                    <option value="">Selecciona una playlist</option>
                                    <option v-for="playlist in station.playlists" :key="playlist.id" :value="String(playlist.id)">
                                        {{ playlist.name }}
                                    </option>
                                </select>
                                <input v-model="scheduleForm.name" type="text" class="input-field lg:col-span-3" placeholder="Nombre del bloque" />
                                <input v-model="scheduleForm.start_time" type="time" class="input-field" />
                                <input v-model="scheduleForm.end_time" type="time" class="input-field" />
                                <input v-model.number="scheduleForm.priority" type="number" min="0" max="100" class="input-field" />
                                <button class="btn-primary lg:col-span-2" :disabled="scheduleCreating" @click="createSchedule">
                                    {{ scheduleCreating ? 'Programando...' : 'Crear bloque horario' }}
                                </button>
                            </div>

                            <div class="flex flex-wrap gap-2 mt-4">
                                <label v-for="day in weekDays" :key="day.value" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
                                    <input v-model="scheduleForm.days_of_week" :value="day.value" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    {{ day.label }}
                                </label>
                            </div>

                            <div class="space-y-3 mt-6">
                                <div v-if="!flattenedSchedules.length" class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
                                    Aun no hay bloques programados para la emision automatica.
                                </div>

                                <div v-for="schedule in flattenedSchedules" :key="schedule.id" class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                    <div>
                                        <div class="flex flex-wrap items-center gap-2">
                                            <p class="font-medium text-gray-900 dark:text-white">{{ schedule.name }}</p>
                                            <span :class="schedule.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'" class="px-2 py-1 rounded-full text-xs">
                                                {{ schedule.is_active ? 'Activo' : 'Pausado' }}
                                            </span>
                                            <span v-if="schedule.is_jingle_playlist" class="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                Jingle
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ schedule.playlist_name }}</p>
                                        <p class="text-xs text-gray-400 mt-1">
                                            {{ formatClock(schedule.start_time) }} - {{ formatClock(schedule.end_time) }} · {{ scheduleDaysLabel(schedule.days_of_week) }} · prioridad {{ schedule.priority }}
                                        </p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="btn-secondary !px-4" @click="toggleSchedule(station.playlists.find((playlist) => playlist.id === schedule.playlist_id)!, schedule)">
                                            {{ schedule.is_active ? 'Pausar' : 'Reactivar' }}
                                        </button>
                                        <button class="btn-danger !px-4" @click="deleteSchedule(station.playlists.find((playlist) => playlist.id === schedule.playlist_id)!, schedule)">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Telemetria en tiempo real</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Sincronizacion de estado, audiencia y salud operativa.</p>

                            <div class="space-y-4 mt-6">
                                <div class="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4">
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm text-gray-500 dark:text-gray-400">Estado AutoDJ</p>
                                        <span :class="station.auto_dj_status === 'running' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'" class="font-semibold">
                                            {{ station.auto_dj_status || 'idle' }}
                                        </span>
                                    </div>
                                    <div class="mt-4 flex items-end gap-2 h-24">
                                        <div v-for="(point, index) in listenerStats.slice(-12)" :key="index" class="flex-1 flex flex-col justify-end">
                                            <div class="bg-tuistream-500 rounded-t-md min-h-1" :style="{ height: audienceBar(point.listeners) }" />
                                        </div>
                                    </div>
                                    <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
                                        <span>Ultimas 12 muestras</span>
                                        <span>Max {{ listenerMax }}</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                        <p class="text-xs text-gray-400">Modo</p>
                                        <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white uppercase">{{ station.audio_format }} / {{ station.bitrate }} kbps</p>
                                    </div>
                                    <div class="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                        <p class="text-xs text-gray-400">Capacidad</p>
                                        <p class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{{ station.max_listeners }} oyentes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Transiciones automaticas</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Controla crossfades, rotacion y uso de jingles.</p>

                            <div class="space-y-4 mt-6 text-sm">
                                <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                                    <span class="text-gray-500">Playlists de jingles</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ jinglePlaylists }}</span>
                                </div>
                                <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                                    <span class="text-gray-500">Crossfade promedio</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">
                                        {{ station.playlists.length ? (station.playlists.reduce((total, playlist) => total + (playlist.crossfade_duration || 0), 0) / station.playlists.length).toFixed(1) : '0.0' }} s
                                    </span>
                                </div>
                                <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                                    <span class="text-gray-500">Playlists ponderadas</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ station.playlists.filter((playlist) => playlist.playback_order === 'weighted').length }}</span>
                                </div>
                                <div class="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-4 text-indigo-700 dark:text-indigo-300">
                                    Las transiciones se gobiernan por el crossfade de cada playlist y la prioridad de cada bloque horario.
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gestion centralizada</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ajusta los parametros base de la emision desde un solo panel.</p>

                            <div class="space-y-3 mt-6">
                                <textarea v-model="station.description" rows="3" class="input-field" placeholder="Descripcion interna de la emisora" />
                                <input v-model="station.website_url" type="url" class="input-field" placeholder="https://tu-sitio.com" />
                                <input v-model="station.mount_point" type="text" class="input-field" placeholder="/stream" />
                                <div class="grid grid-cols-2 gap-3">
                                    <input v-model.number="station.bitrate" type="number" min="32" max="320" class="input-field" placeholder="Bitrate" />
                                    <input v-model.number="station.max_listeners" type="number" min="1" class="input-field" placeholder="Oyentes max." />
                                </div>
                                <select v-model="station.audio_format" class="input-field">
                                    <option value="mp3">MP3</option>
                                    <option value="aac">AAC</option>
                                    <option value="ogg">OGG</option>
                                </select>
                                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <input v-model="station.auto_dj_enabled" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    AutoDJ habilitado
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <input v-model="station.is_public" type="checkbox" class="rounded border-gray-300 text-tuistream-600 focus:ring-tuistream-500" />
                                    Emision publica
                                </label>
                                <button class="btn-primary w-full" :disabled="stationSaving" @click="saveStationConfig">
                                    {{ stationSaving ? 'Guardando...' : 'Guardar configuracion' }}
                                </button>
                            </div>
                        </div>

                        <div class="card">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Historial reciente</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Seguimiento del contenido emitido recientemente.</p>

                            <div class="space-y-3 mt-6">
                                <div v-if="!station.song_history.length" class="text-sm text-gray-400 text-center py-6">
                                    Todavia no hay reproducciones registradas.
                                </div>
                                <div v-for="track in station.song_history" :key="track.id" class="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ track.title }}</p>
                                    <p class="text-xs text-gray-400 mt-1">{{ track.artist || 'Artista no disponible' }}</p>
                                    <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
                                        <span>{{ formatDateTime(track.played_at) }}</span>
                                        <span>{{ track.listeners_at_time }} oyentes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-else class="card flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <div>
                    <p class="text-base font-semibold text-gray-700 dark:text-gray-300">Estacion no encontrada</p>
                    <p class="text-sm text-gray-400 mt-1">No se encontro la estacion o no tienes permisos para verla.</p>
                </div>
                <Link href="/client/stations" class="btn-primary text-sm px-5 py-2.5">
                    Volver a mis emisoras
                </Link>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
