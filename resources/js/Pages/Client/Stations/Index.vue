<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Station {
    id: number; name: string; slug: string; is_active: boolean;
    current_listeners: number; max_listeners: number;
    bitrate: number; audio_format: string; genre: string | null;
    auto_dj_status: string | null; current_song: string | null;
    stream_url: string | null;
}

const stations = ref<Station[]>([]);
const loading = ref(true);
const error = ref('');
const actionLoading = ref<number | null>(null);

async function fetchStations() {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get('/api/stations');
        stations.value = Array.isArray(data) ? data : [];
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar las emisoras';
    } finally {
        loading.value = false;
    }
}

async function toggleAutoDj(station: Station) {
    actionLoading.value = station.id;
    error.value = '';
    try {
        const action = station.auto_dj_status === 'running' ? 'stop' : 'start';
        await axios.post(`/api/stations/${station.id}/${action}`);
        await fetchStations();
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cambiar estado del AutoDJ';
    } finally {
        actionLoading.value = null;
    }
}

onMounted(fetchStations);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav><SidebarNav /></template>
        <div class="space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mis Emisoras</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus estaciones de streaming de audio</p>
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

            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            </div>

            <div v-else-if="!stations.length" class="card flex flex-col items-center justify-center py-16 text-center">
                <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">Sin emisoras</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">Contacta al administrador para crear una</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="station in stations" :key="station.id" class="card hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-tuistream-100 dark:bg-tuistream-800 flex items-center justify-center">
                                <svg class="w-6 h-6 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-white">{{ station.name }}</p>
                                <p class="text-xs text-gray-400">{{ station.genre || 'Sin género' }} · {{ station.bitrate }}kbps {{ station.audio_format?.toUpperCase() }}</p>
                            </div>
                        </div>
                        <span :class="station.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium">{{ station.is_active ? 'Online' : 'Offline' }}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-lg font-bold text-gray-900 dark:text-white">{{ station.current_listeners || 0 }}</p><p class="text-xs text-gray-400">Oyentes</p></div>
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-lg font-bold text-gray-900 dark:text-white">{{ station.max_listeners }}</p><p class="text-xs text-gray-400">Máx</p></div>
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ station.current_song || '—' }}</p><p class="text-xs text-gray-400">Canción</p></div>
                    </div>

                    <div class="flex gap-2">
                        <Link :href="`/client/stations/${station.id}/autodj`" class="flex-1 py-2 text-center text-sm font-medium rounded-xl bg-tuistream-50 dark:bg-tuistream-900/30 text-tuistream-700 dark:text-tuistream-300 hover:bg-tuistream-100 dark:hover:bg-tuistream-900/50 transition-colors">Abrir AutoDJ</Link>
                        <button v-if="station.is_active" @click="toggleAutoDj(station)" :disabled="actionLoading === station.id" :class="['px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50', station.auto_dj_status === 'running' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100' : 'bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100']">
                            <svg v-if="actionLoading === station.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            <span v-else>{{ station.auto_dj_status === 'running' ? 'Detener' : 'Iniciar' }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
