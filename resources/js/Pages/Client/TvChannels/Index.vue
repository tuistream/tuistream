<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface TvChannel { id: number; name: string; slug: string; description: string | null; channel_type: string; is_active: boolean; hls_url: string | null; rtmp_url: string | null; stream_key: string | null; current_viewers: number; peak_viewers: number; resolution: string | null; bitrate: number | null; current_program: string | null; }

const channels = ref<TvChannel[]>([]);
const loading = ref(true);
const error = ref('');

function typeLabel(t: string) { const m: Record<string,string>={tv_247:'TV 24/7',web_tv:'Web TV',visual_radio:'Radio Visual',live_event:'Evento en Vivo'}; return m[t]||t; }
function typeColor(t: string) { const m: Record<string,string>={tv_247:'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',web_tv:'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',visual_radio:'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',live_event:'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}; return m[t]||'bg-gray-100 text-gray-600'; }

async function fetchChannels() {
    loading.value = true;
    error.value = '';
    try { const { data } = await axios.get('/api/tv-channels'); channels.value = Array.isArray(data) ? data : []; }
    catch (e: any) { error.value = e.response?.data?.message || 'Error al cargar los canales'; }
    finally { loading.value = false; }
}

onMounted(fetchChannels);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav><SidebarNav /></template>
        <div class="space-y-6">
            <div><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mis Canales TV</h2><p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus canales de streaming de video</p></div>

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

            <div v-if="loading" class="card flex items-center justify-center py-16"><svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>

            <div v-else-if="!channels.length" class="card flex flex-col items-center justify-center py-16 text-center">
                <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">Sin canales TV</p><p class="text-sm text-gray-400 dark:text-gray-500">Contacta al administrador para crear uno</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="ch in channels" :key="ch.id" class="card hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center"><svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>
                            <div><p class="font-semibold text-gray-900 dark:text-white">{{ ch.name }}</p><p class="text-xs text-gray-400">{{ ch.resolution || '—' }} · {{ ch.bitrate?.toLocaleString() || '—' }} Kbps</p></div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span :class="typeColor(ch.channel_type)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ typeLabel(ch.channel_type) }}</span>
                            <span :class="ch.is_active ? 'text-green-500' : 'text-gray-400'" class="text-xs">{{ ch.is_active ? '● Online' : '● Offline' }}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3 mb-3">
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-lg font-bold text-gray-900 dark:text-white">{{ ch.current_viewers || 0 }}</p><p class="text-xs text-gray-400">Espectadores</p></div>
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-lg font-bold text-gray-900 dark:text-white">{{ ch.peak_viewers || 0 }}</p><p class="text-xs text-gray-400">Pico</p></div>
                        <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ ch.current_program || '—' }}</p><p class="text-xs text-gray-400">Programa</p></div>
                    </div>
                    <div v-if="ch.hls_url" class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800"><p class="text-xs text-gray-400">HLS URL</p><code class="text-xs text-gray-900 dark:text-white break-all">{{ ch.hls_url }}</code></div>
                    <Link :href="`/client/tv-channels/${ch.id}`" class="mt-3 inline-flex w-full items-center justify-center px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        Abrir Web TV
                    </Link>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
