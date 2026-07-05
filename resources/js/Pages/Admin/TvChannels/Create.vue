<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Client {
    id: number;
    name: string;
    email: string;
}

const clients = ref<Client[]>([]);
const loadingClients = ref(true);
const submitting = ref(false);
const error = ref('');

const form = ref({
    name: '',
    client_id: null as number | null,
    description: '',
    channel_type: 'web_tv',
    resolution: '1920x1080',
    bitrate: 4000,
});

const channelTypes = [
    { value: 'tv_247', label: 'TV 24/7', desc: 'Transmisión continua programada' },
    { value: 'web_tv', label: 'Web TV', desc: 'Canal web con emisiones programadas' },
    { value: 'visual_radio', label: 'Radio Visual', desc: 'Audio + visualización estática' },
    { value: 'live_event', label: 'Evento en Vivo', desc: 'Transmisión única de evento' },
];

const resolutions = ['3840x2160 (4K)', '2560x1440 (2K)', '1920x1080 (Full HD)', '1280x720 (HD)', '854x480 (SD)'];

const bitrateOptions = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 15000];

async function fetchClients() {
    try {
        const { data } = await axios.get('/api/clients');
        clients.value = data.data || data;
    } catch (e) {
        console.error('Error fetching clients:', e);
    } finally {
        loadingClients.value = false;
    }
}

async function submit() {
    error.value = '';
    if (!form.value.name.trim()) { error.value = 'El nombre es obligatorio'; return; }
    if (!form.value.client_id) { error.value = 'Debes seleccionar un cliente'; return; }

    submitting.value = true;
    try {
        await axios.post('/api/tv-channels', form.value);
        router.visit('/admin/tv-channels');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al crear el canal';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

function goBack() {
    router.visit('/admin/tv-channels');
}

onMounted(fetchClients);
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Canal TV</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura un nuevo canal de streaming de video</p>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
            </div>

            <!-- Form -->
            <div class="card">
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

                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Nombre del canal <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Ej: Canal Deportivo HD"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                        <textarea
                            v-model="form.description"
                            rows="3"
                            placeholder="Breve descripción del canal..."
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    <!-- Channel Type -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Tipo de canal <span class="text-red-500">*</span>
                        </label>
                        <div class="grid grid-cols-2 gap-3">
                            <button
                                v-for="ct in channelTypes"
                                :key="ct.value"
                                type="button"
                                @click="form.channel_type = ct.value"
                                :class="[
                                    'p-4 rounded-xl border-2 text-left transition-all duration-200',
                                    form.channel_type === ct.value
                                        ? 'border-tuistream-500 bg-tuistream-50 dark:bg-tuistream-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                ]"
                            >
                                <p class="text-sm font-semibold" :class="form.channel_type === ct.value ? 'text-tuistream-700 dark:text-tuistream-300' : 'text-gray-700 dark:text-gray-300'">
                                    {{ ct.label }}
                                </p>
                                <p class="text-xs text-gray-400 mt-1">{{ ct.desc }}</p>
                            </button>
                        </div>
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
                                Creando...
                            </span>
                            <span v-else>Crear Canal TV</span>
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
        </div>
    </AuthenticatedLayout>
</template>
