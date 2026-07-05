<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Client {
    id: number;
    name: string;
    email: string;
}

interface TvChannel {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    client: { id: number; name: string } | null;
    client_id: number;
    channel_type: string;
    is_active: boolean;
    is_public: boolean;
    rtmp_url: string | null;
    hls_url: string | null;
    dash_url: string | null;
    stream_key: string | null;
    current_viewers: number;
    peak_viewers: number;
    current_program: string | null;
    resolution: string | null;
    bitrate: number | null;
    auto_schedule_enabled: boolean;
    last_stream_started_at: string | null;
    created_at: string;
    schedules: any[];
}

const page = usePage();
const channelId = computed(() => {
    const parts = page.url.split('/');
    return parseInt(parts[parts.length - 1]);
});

const channel = ref<TvChannel | null>(null);
const clients = ref<Client[]>([]);
const loading = ref(true);
const loadingClients = ref(true);
const submitting = ref(false);
const toggling = ref(false);
const error = ref('');

const form = ref({
    name: '',
    client_id: null as number | null,
    description: '',
    channel_type: 'web_tv',
    resolution: '',
    bitrate: 0,
    is_active: true,
    is_public: false,
    auto_schedule_enabled: false,
});

const channelTypes = [
    { value: 'tv_247', label: 'TV 24/7', desc: 'Transmisión continua programada' },
    { value: 'web_tv', label: 'Web TV', desc: 'Canal web con emisiones programadas' },
    { value: 'visual_radio', label: 'Radio Visual', desc: 'Audio + visualización estática' },
    { value: 'live_event', label: 'Evento en Vivo', desc: 'Transmisión única de evento' },
];

const resolutions = ['3840x2160 (4K)', '2560x1440 (2K)', '1920x1080 (Full HD)', '1280x720 (HD)', '854x480 (SD)'];
const bitrateOptions = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000];

function channelTypeLabel(type: string) {
    const map: Record<string, string> = { tv_247: 'TV 24/7', web_tv: 'Web TV', visual_radio: 'Radio Visual', live_event: 'Evento en Vivo' };
    return map[type] || type;
}

async function fetchData() {
    try {
        const [channelRes, clientsRes] = await Promise.all([
            axios.get(`/api/tv-channels/${channelId.value}`),
            axios.get('/api/clients'),
        ]);
        channel.value = channelRes.data;
        clients.value = clientsRes.data.data || clientsRes.data;

        form.value = {
            name: channel.value.name,
            client_id: channel.value.client_id,
            description: channel.value.description || '',
            channel_type: channel.value.channel_type,
            resolution: channel.value.resolution || '1920x1080',
            bitrate: channel.value.bitrate || 4000,
            is_active: channel.value.is_active,
            is_public: channel.value.is_public,
            auto_schedule_enabled: channel.value.auto_schedule_enabled,
        };
    } catch (e) {
        error.value = 'Error al cargar el canal';
    } finally {
        loading.value = false;
        loadingClients.value = false;
    }
}

async function submit() {
    error.value = '';
    if (!form.value.name.trim()) { error.value = 'El nombre es obligatorio'; return; }

    submitting.value = true;
    try {
        await axios.put(`/api/tv-channels/${channelId.value}`, {
            name: form.value.name,
            description: form.value.description,
            resolution: form.value.resolution,
            bitrate: form.value.bitrate,
            is_active: form.value.is_active,
        });
        router.visit('/admin/tv-channels');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al actualizar';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

async function toggleActive() {
    if (!channel.value) return;
    toggling.value = true;
    try {
        await axios.put(`/api/tv-channels/${channelId.value}`, { is_active: !channel.value.is_active });
        channel.value.is_active = !channel.value.is_active;
        form.value.is_active = channel.value.is_active;
    } catch (e) {
        console.error('Error toggling:', e);
    } finally {
        toggling.value = false;
    }
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
}

function goBack() {
    router.visit('/admin/tv-channels');
}

function formatDateTime(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'medium' });
}

onMounted(fetchData);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6 max-w-2xl">
            <!-- Header -->
            <div class="flex items-center gap-4">
                <button
                    @click="goBack"
                    class="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Editar Canal TV</h2>
                    <p v-if="channel" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ channel.name }} —
                        <span :class="channel.is_active ? 'text-green-600' : 'text-gray-400'">
                            {{ channel.is_active ? 'Transmitiendo' : 'Detenido' }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
            </div>

            <template v-if="channel">
                <!-- Stream Info Card -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Información de Streaming</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">RTMP URL</p>
                            <div class="flex items-center gap-2">
                                <code class="text-xs text-gray-900 dark:text-white truncate flex-1">{{ channel.rtmp_url || 'No configurada' }}</code>
                                <button
                                    v-if="channel.rtmp_url"
                                    @click="copyToClipboard(channel.rtmp_url!)"
                                    class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0"
                                >
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">HLS URL</p>
                            <code class="text-xs text-gray-900 dark:text-white break-all">{{ channel.hls_url || 'No configurada' }}</code>
                        </div>
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">DASH URL</p>
                            <code class="text-xs text-gray-900 dark:text-white break-all">{{ channel.dash_url || 'No configurada' }}</code>
                        </div>
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">Stream Key</p>
                            <code class="text-sm text-gray-900 dark:text-white">{{ channel.stream_key || '—' }}</code>
                        </div>
                    </div>

                    <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel.current_viewers ?? 0 }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Viewers</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ channel.peak_viewers ?? 0 }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Pico</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-sm font-bold text-gray-900 dark:text-white truncate px-1">{{ channel.resolution || '—' }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Resolución</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ channel.bitrate?.toLocaleString() || '—' }} Kbps</p>
                            <p class="text-xs text-gray-400 mt-0.5">Bitrate</p>
                        </div>
                    </div>
                </div>

                <!-- Edit Form -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Editar configuración</h3>
                    <form @submit.prevent="submit" class="space-y-6">
                        <!-- Read-only info -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cliente</label>
                                <input :value="channel.client?.name" type="text" disabled class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de canal</label>
                                <input :value="channelTypeLabel(channel.channel_type)" type="text" disabled class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed" />
                            </div>
                        </div>

                        <!-- Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nombre del canal <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="form.name"
                                type="text"
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                            <textarea
                                v-model="form.description"
                                rows="3"
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>

                        <!-- Grid: Resolution + Bitrate -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Resolución</label>
                                <div class="relative">
                                    <select
                                        v-model="form.resolution"
                                        class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option v-for="r in resolutions" :key="r" :value="r">{{ r }}</option>
                                    </select>
                                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Bitrate <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <select
                                        v-model.number="form.bitrate"
                                        class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option v-for="b in bitrateOptions" :key="b" :value="b">{{ b.toLocaleString() }} Kbps</option>
                                    </select>
                                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Toggles -->
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Transmitiendo</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Activar o detener la transmisión</p>
                                </div>
                                <button
                                    type="button"
                                    @click="toggleActive"
                                    :disabled="toggling"
                                    :class="[
                                        'relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50',
                                        form.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    ]"
                                >
                                    <span
                                        :class="[
                                            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                                            form.is_active ? 'translate-x-5' : ''
                                        ]"
                                    />
                                </button>
                            </div>

                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Público</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visible en el directorio público</p>
                                </div>
                                <button
                                    type="button"
                                    @click="form.is_public = !form.is_public"
                                    :class="[
                                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                                        form.is_public ? 'bg-tuistream-600' : 'bg-gray-300 dark:bg-gray-600'
                                    ]"
                                >
                                    <span
                                        :class="[
                                            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                                            form.is_public ? 'translate-x-5' : ''
                                        ]"
                                    />
                                </button>
                            </div>
                        </div>

                        <!-- Submit -->
                        <div class="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                :disabled="submitting"
                                class="flex-1 sm:flex-none px-6 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span v-if="submitting" class="inline-flex items-center gap-2">
                                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Guardando...
                                </span>
                                <span v-else>Guardar Cambios</span>
                            </button>
                            <button
                                type="button"
                                @click="goBack"
                                class="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </template>
        </div>
    </AuthenticatedLayout>
</template>
