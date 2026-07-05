<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

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
    stream_key: string | null;
    current_viewers: number;
    peak_viewers: number;
    current_program: string | null;
    resolution: string | null;
    bitrate: number | null;
    auto_schedule_enabled: boolean;
    last_stream_started_at: string | null;
    created_at: string;
}

const channels = ref<TvChannel[]>([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const deleting = ref<number | null>(null);
const actionLoading = ref<number | null>(null);

const filteredChannels = computed(() => {
    if (!search.value) return channels.value;
    const q = search.value.toLowerCase();
    return channels.value.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.client?.name?.toLowerCase().includes(q) ||
        c.channel_type?.toLowerCase().includes(q)
    );
});

async function fetchChannels() {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get('/api/tv-channels');
        channels.value = data;
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar los canales';
    } finally {
        loading.value = false;
    }
}

async function deleteChannel(channel: TvChannel) {
    if (!confirm(`¿Eliminar el canal "${channel.name}"? Esta acción no se puede deshacer.`)) return;
    deleting.value = channel.id;
    error.value = '';
    try {
        await axios.delete(`/api/tv-channels/${channel.id}`);
        channels.value = channels.value.filter(c => c.id !== channel.id);
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al eliminar el canal';
    } finally {
        deleting.value = null;
    }
}

async function toggleStream(channel: TvChannel) {
    actionLoading.value = channel.id;
    error.value = '';
    try {
        if (channel.is_active) {
            await axios.post(`/api/tv-channels/${channel.id}/stop`);
        } else {
            await axios.post(`/api/tv-channels/${channel.id}/start`);
        }
        await fetchChannels();
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cambiar estado del stream';
    } finally {
        actionLoading.value = null;
    }
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

function channelTypeColor(type: string) {
    const map: Record<string, string> = {
        tv_247: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        web_tv: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
        visual_radio: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        live_event: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[type] || 'bg-gray-100 text-gray-600';
}

function statusBadge(channel: TvChannel) {
    if (!channel.is_active) return { label: 'Detenido', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
    return { label: 'Transmitiendo', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
}

onMounted(fetchChannels);
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Canales de TV</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona los canales de streaming de video</p>
                </div>
                <Link
                    href="/admin/tv-channels/create"
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Canal TV
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
                    placeholder="Buscar por nombre, cliente o tipo..."
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
                    <span class="text-sm text-gray-400">Cargando canales...</span>
                </div>
            </div>

            <!-- Table -->
            <div v-else class="card overflow-hidden !p-0">
                <div v-if="!filteredChannels.length" class="flex flex-col items-center justify-center py-16 text-center px-4">
                    <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">No hay canales de TV</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Crea tu primer canal de streaming de video</p>
                    <Link href="/admin/tv-channels/create" class="inline-flex items-center gap-2 px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Canal TV
                    </Link>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-100 dark:border-gray-800">
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Canal</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">Cliente</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Resolución</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden sm:table-cell">Viewers</th>
                                <th class="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Estado</th>
                                <th class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                            <tr
                                v-for="channel in filteredChannels"
                                :key="channel.id"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="font-medium text-gray-900 dark:text-white truncate">{{ channel.name }}</p>
                                            <p v-if="channel.current_program" class="text-xs text-blue-500 truncate">{{ channel.current_program }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 px-4 hidden md:table-cell">
                                    <span class="text-gray-600 dark:text-gray-400">{{ channel.client?.name || '—' }}</span>
                                </td>
                                <td class="py-3 px-4 text-center hidden lg:table-cell">
                                    <span :class="channelTypeColor(channel.channel_type)" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium">
                                        {{ channelTypeLabel(channel.channel_type) }}
                                    </span>
                                </td>
                                <td class="py-3 px-4 text-center hidden sm:table-cell">
                                    <span class="text-gray-600 dark:text-gray-400">{{ channel.resolution || '—' }}</span>
                                </td>
                                <td class="py-3 px-4 text-center hidden sm:table-cell">
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ channel.current_viewers ?? 0 }}</span>
                                    <span v-if="channel.peak_viewers" class="text-xs text-gray-400 ml-1">/ {{ channel.peak_viewers }}</span>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span :class="statusBadge(channel).class" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                        <span :class="channel.is_active ? 'bg-green-500' : 'bg-gray-400'" class="w-1.5 h-1.5 rounded-full animate-pulse" />
                                        {{ statusBadge(channel).label }}
                                    </span>
                                </td>
                                <td class="py-3 px-4">
                                    <div class="flex items-center justify-end gap-1">
                                        <!-- Schedule -->
                                        <Link
                                            :href="`/admin/tv-channels/${channel.id}/schedule`"
                                            class="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                                            title="Programación"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </Link>
                                        <!-- Stream toggle -->
                                        <button
                                            @click="toggleStream(channel)"
                                            :disabled="actionLoading === channel.id"
                                            :title="channel.is_active ? 'Detener stream' : 'Iniciar stream'"
                                            :class="[
                                                'p-2 rounded-lg transition-all duration-200 disabled:opacity-50',
                                                channel.is_active
                                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            ]"
                                        >
                                            <svg v-if="actionLoading === channel.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else-if="channel.is_active" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>

                                        <!-- Edit -->
                                        <Link
                                            :href="`/admin/tv-channels/${channel.id}`"
                                            class="p-2 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                            title="Editar"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>

                                        <!-- Delete -->
                                        <button
                                            @click="deleteChannel(channel)"
                                            :disabled="deleting === channel.id"
                                            class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            <svg v-if="deleting === channel.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
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

            <div v-if="!loading && channels.length" class="text-sm text-gray-400 dark:text-gray-500">
                {{ channels.length }} canal{{ channels.length !== 1 ? 'es' : '' }} en total
            </div>
        </div>
    </AuthenticatedLayout>
</template>
