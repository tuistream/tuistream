<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Station {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    genre: string | null;
    client: { id: number; name: string } | null;
    client_id: number;
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
    created_at: string;
}

const stations = ref<Station[]>([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const deleting = ref<number | null>(null);
const actionLoading = ref<number | null>(null);

const filteredStations = computed(() => {
    if (!search.value) return stations.value;
    const q = search.value.toLowerCase();
    return stations.value.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.client?.name?.toLowerCase().includes(q) ||
        s.genre?.toLowerCase().includes(q)
    );
});

async function fetchStations() {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get('/api/stations');
        stations.value = data;
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar las emisoras';
    } finally {
        loading.value = false;
    }
}

async function deleteStation(station: Station) {
    if (!confirm(`¿Eliminar la emisora "${station.name}"? Esta acción no se puede deshacer.`)) return;
    deleting.value = station.id;
    error.value = '';
    try {
        await axios.delete(`/api/stations/${station.id}`);
        stations.value = stations.value.filter(s => s.id !== station.id);
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al eliminar la emisora';
    } finally {
        deleting.value = null;
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

function statusBadge(station: Station) {
    if (!station.is_active) return { label: 'Inactiva', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
    if (station.auto_dj_status === 'running') return { label: 'Transmitiendo', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    return { label: 'Activa', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
}

function formatBitrate(kbps: number) {
    return `${kbps} Kbps`;
}

onMounted(fetchStations);
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Emisoras</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las estaciones de streaming de audio</p>
                </div>
                <Link
                    href="/admin/stations/create"
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Emisora
                </Link>
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

            <!-- Search -->
            <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Buscar por nombre, cliente o género..."
                    class="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-3">
                    <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span class="text-sm text-gray-400">Cargando emisoras...</span>
                </div>
            </div>

            <!-- Table -->
            <div v-else class="card overflow-hidden !p-0">
                <div v-if="!filteredStations.length" class="flex flex-col items-center justify-center py-16 text-center px-4">
                    <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No hay emisoras</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Crea tu primera emisora para empezar</p>
                    <Link
                        href="/admin/stations/create"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl transition-all"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Emisora
                    </Link>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-100 dark:border-gray-800">
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Emisora</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">Cliente</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden lg:table-cell">Género</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Bitrate</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Oyentes</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Estado</th>
                                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                            <tr
                                v-for="station in filteredStations"
                                :key="station.id"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-800 flex items-center justify-center flex-shrink-0">
                                            <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="font-medium text-gray-900 dark:text-white truncate">{{ station.name }}</p>
                                            <p class="text-xs text-gray-400 uppercase">{{ station.audio_format }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 px-4 hidden md:table-cell">
                                    <span class="text-gray-600 dark:text-gray-400">{{ station.client?.name || '—' }}</span>
                                </td>
                                <td class="py-3 px-4 hidden lg:table-cell">
                                    <span class="text-gray-600 dark:text-gray-400">{{ station.genre || '—' }}</span>
                                </td>
                                <td class="py-3 px-4 text-center hidden sm:table-cell">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        {{ formatBitrate(station.bitrate) }}
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-center hidden sm:table-cell">
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ station.current_listeners ?? 0 }}</span>
                                    <span class="text-xs text-gray-400 ml-1">/ {{ station.max_listeners }}</span>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span
                                        :class="statusBadge(station).class"
                                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                                    >
                                        <span
                                            :class="station.auto_dj_status === 'running' ? 'bg-green-500' : station.is_active ? 'bg-blue-500' : 'bg-gray-400'"
                                            class="w-1.5 h-1.5 rounded-full"
                                        />
                                        {{ statusBadge(station).label }}
                                    </span>
                                </td>
                                <td class="py-3 px-4">
                                    <div class="flex items-center justify-end gap-1">
                                        <button
                                            v-if="station.is_active"
                                            @click="toggleAutoDj(station)"
                                            :disabled="actionLoading === station.id"
                                            :title="station.auto_dj_status === 'running' ? 'Detener AutoDJ' : 'Iniciar AutoDJ'"
                                            :class="[
                                                'p-2 rounded-lg transition-all duration-200 disabled:opacity-50',
                                                station.auto_dj_status === 'running'
                                                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    : 'text-gray-400 hover:text-tuistream-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            ]"
                                        >
                                            <svg v-if="actionLoading === station.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else-if="station.auto_dj_status === 'running'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>

                                        <Link
                                            :href="`/admin/stations/${station.id}`"
                                            class="p-2 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                            title="Editar"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>

                                        <button
                                            @click="deleteStation(station)"
                                            :disabled="deleting === station.id"
                                            class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <svg v-if="deleting === station.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="!loading && stations.length" class="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                <span>{{ stations.length }} emisora{{ stations.length !== 1 ? 's' : '' }} en total</span>
                <span v-if="search && filteredStations.length !== stations.length">
                    {{ filteredStations.length }} resultado{{ filteredStations.length !== 1 ? 's' : '' }}
                </span>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
