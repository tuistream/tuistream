<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Client {
    id: number;
    name: string;
    email: string;
}

interface Station {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    genre: string | null;
    client_id: number;
    client: { id: number; name: string } | null;
    is_active: boolean;
    is_public: boolean;
    stream_url: string | null;
    stream_ssl_url: string | null;
    source_password: string | null;
    admin_password: string | null;
    max_listeners: number;
    bitrate: number;
    audio_format: string;
    auto_dj_enabled: boolean;
    auto_dj_status: string | null;
    current_song: string | null;
    current_listeners: number;
    peak_listeners: number;
    mount_point: string | null;
    created_at: string;
}

const page = usePage();
const stationId = computed(() => {
    const path = page.url;
    const parts = path.split('/');
    return parseInt(parts[parts.length - 1]);
});

const station = ref<Station | null>(null);
const clients = ref<Client[]>([]);
const loading = ref(true);
const loadingClients = ref(true);
const submitting = ref(false);
const error = ref('');
const showPassword = ref({ source: false, admin: false });

const form = ref({
    name: '',
    client_id: null as number | null,
    description: '',
    genre: '',
    bitrate: 128,
    audio_format: 'mp3',
    max_listeners: 100,
    is_active: true,
    is_public: false,
    auto_dj_enabled: false,
});

const genres = [
    'Rock', 'Pop', 'Electrónica', 'Jazz', 'Clásica', 'Hip Hop', 'R&B',
    'Reggae', 'Latina', 'Indie', 'Metal', 'Folk', 'Blues', 'Country',
    'Salsa', 'Bachata', 'Cumbia', 'Corridos', 'Regional Mexicano',
    'Noticias', 'Deportes', 'Talk Show', 'Religiosa', 'Infantil',
];

const audioFormats = [
    { value: 'mp3', label: 'MP3' },
    { value: 'aac', label: 'AAC' },
    { value: 'ogg', label: 'OGG' },
];

const bitrateOptions = [32, 48, 64, 96, 128, 160, 192, 256, 320];

async function fetchData() {
    try {
        const [stationRes, clientsRes] = await Promise.all([
            axios.get(`/api/stations/${stationId.value}`),
            axios.get('/api/clients'),
        ]);
        station.value = stationRes.data;
        clients.value = clientsRes.data.data || clientsRes.data;

        form.value = {
            name: station.value.name,
            client_id: station.value.client_id,
            description: station.value.description || '',
            genre: station.value.genre || '',
            bitrate: station.value.bitrate,
            audio_format: station.value.audio_format,
            max_listeners: station.value.max_listeners,
            is_active: station.value.is_active,
            is_public: station.value.is_public,
            auto_dj_enabled: station.value.auto_dj_enabled,
        };
    } catch (e) {
        console.error('Error fetching station:', e);
        error.value = 'Error al cargar la emisora';
    } finally {
        loading.value = false;
        loadingClients.value = false;
    }
}

async function submit() {
    if (!form.value.name.trim()) {
        error.value = 'El nombre es obligatorio';
        return;
    }
    if (!form.value.client_id) {
        error.value = 'Debes seleccionar un cliente';
        return;
    }

    submitting.value = true;
    error.value = '';

    try {
        await axios.put(`/api/stations/${stationId.value}`, form.value);
        router.visit('/admin/stations');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al actualizar la emisora';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

async function toggleActive() {
    if (!station.value) return;
    try {
        await axios.put(`/api/stations/${stationId.value}`, { is_active: !station.value.is_active });
        station.value.is_active = !station.value.is_active;
        form.value.is_active = station.value.is_active;
    } catch (e) {
        console.error('Error toggling station:', e);
    }
}

function goBack() {
    router.visit('/admin/stations');
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Editar Emisora</h2>
                    <p v-if="station" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ station.name }} —
                        <span :class="station.is_active ? 'text-green-600' : 'text-gray-400'">
                            {{ station.is_active ? 'Activa' : 'Inactiva' }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-3">
                    <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span class="text-sm text-gray-400">Cargando emisora...</span>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
            </div>

            <template v-if="station">
                <!-- Stream Info Card -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Información de Streaming</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Stream URL -->
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">Stream URL</p>
                            <div class="flex items-center gap-2">
                                <code class="text-sm text-gray-900 dark:text-white truncate flex-1">{{ station.stream_url || 'No configurada' }}</code>
                                <button
                                    v-if="station.stream_url"
                                    @click="copyToClipboard(station.stream_url!)"
                                    class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    title="Copiar"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Stream SSL URL -->
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">Stream SSL URL</p>
                            <code class="text-sm text-gray-900 dark:text-white">{{ station.stream_ssl_url || 'No configurada' }}</code>
                        </div>

                        <!-- Source Password -->
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">Source Password</p>
                            <div class="flex items-center gap-2">
                                <code class="text-sm text-gray-900 dark:text-white flex-1">
                                    {{ showPassword.source ? station.source_password : '••••••••••••••••' }}
                                </code>
                                <button
                                    @click="showPassword.source = !showPassword.source"
                                    class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                >
                                    <svg v-if="showPassword.source" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Admin Password -->
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-xs text-gray-400 mb-1">Admin Password</p>
                            <div class="flex items-center gap-2">
                                <code class="text-sm text-gray-900 dark:text-white flex-1">
                                    {{ showPassword.admin ? station.admin_password : '••••••••••••••••' }}
                                </code>
                                <button
                                    @click="showPassword.admin = !showPassword.admin"
                                    class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                >
                                    <svg v-if="showPassword.admin" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ station.current_listeners ?? 0 }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Oyentes</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ station.peak_listeners ?? 0 }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Pico</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ station.bitrate }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Kbps</p>
                        </div>
                        <div class="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <p class="text-sm font-bold text-gray-900 dark:text-white uppercase">{{ station.audio_format }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">Formato</p>
                        </div>
                    </div>
                </div>

                <!-- Edit Form -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Editar configuración</h3>
                    <form @submit.prevent="submit" class="space-y-6">
                        <!-- Client Select -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Cliente <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <select
                                    v-model="form.client_id"
                                    :disabled="loadingClients"
                                    class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none disabled:opacity-50"
                                >
                                    <option :value="null" disabled>Seleccionar cliente...</option>
                                    <option v-for="client in clients" :key="client.id" :value="client.id">
                                        {{ client.name }} ({{ client.email }})
                                    </option>
                                </select>
                                <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <!-- Station Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nombre de la emisora <span class="text-red-500">*</span>
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

                        <!-- Grid: Genre + Audio Format -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Género</label>
                                <div class="relative">
                                    <select
                                        v-model="form.genre"
                                        class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="">Sin género</option>
                                        <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
                                    </select>
                                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Formato de audio</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="fmt in audioFormats"
                                        :key="fmt.value"
                                        type="button"
                                        @click="form.audio_format = fmt.value"
                                        :class="[
                                            'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 border',
                                            form.audio_format === fmt.value
                                                ? 'bg-tuistream-50 dark:bg-tuistream-900/30 border-tuistream-500 text-tuistream-700 dark:text-tuistream-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                        ]"
                                    >
                                        {{ fmt.label }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Grid: Bitrate + Max Listeners -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Bitrate <span class="text-red-500">*</span>
                                </label>
                                <div class="relative">
                                    <select
                                        v-model.number="form.bitrate"
                                        class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option v-for="b in bitrateOptions" :key="b" :value="b">{{ b }} Kbps</option>
                                    </select>
                                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Máximo de oyentes <span class="text-red-500">*</span>
                                </label>
                                <input
                                    v-model.number="form.max_listeners"
                                    type="number"
                                    min="1"
                                    max="100000"
                                    class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <!-- Toggles -->
                        <div class="space-y-4">
                            <!-- Active -->
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Activa</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">La emisora está disponible para conexiones</p>
                                </div>
                                <button
                                    type="button"
                                    @click="toggleActive"
                                    :class="[
                                        'relative w-11 h-6 rounded-full transition-colors duration-200',
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

                            <!-- Public -->
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Pública</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visible en el directorio público de emisoras</p>
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

                            <!-- Auto DJ -->
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <p class="text-sm font-medium text-gray-900 dark:text-white">Auto DJ</p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Reproducción automática sin fuente externa</p>
                                </div>
                                <button
                                    type="button"
                                    @click="form.auto_dj_enabled = !form.auto_dj_enabled"
                                    :class="[
                                        'relative w-11 h-6 rounded-full transition-colors duration-200',
                                        form.auto_dj_enabled ? 'bg-tuistream-600' : 'bg-gray-300 dark:bg-gray-600'
                                    ]"
                                >
                                    <span
                                        :class="[
                                            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                                            form.auto_dj_enabled ? 'translate-x-5' : ''
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
