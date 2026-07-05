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
    genre: '',
    bitrate: 128,
    audio_format: 'mp3',
    max_listeners: 100,
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
        await axios.post('/api/stations', form.value);
        router.visit('/admin/stations');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al crear la emisora';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

function goBack() {
    router.visit('/admin/stations');
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Nueva Emisora</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura una nueva estación de streaming de audio</p>
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
                        <p v-if="loadingClients" class="text-xs text-gray-400 mt-1">Cargando clientes...</p>
                    </div>

                    <!-- Station Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Nombre de la emisora <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Ej: Radio Latina FM"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                        <textarea
                            v-model="form.description"
                            rows="3"
                            placeholder="Breve descripción de la emisora..."
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all resize-none"
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
                            <span v-else>Crear Emisora</span>
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
