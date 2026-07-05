<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface StationStat {
    id: number;
    name: string;
    current_listeners: number;
    peak_listeners: number;
    total_listening_time: number;
}

interface ChannelStat {
    id: number;
    name: string;
    current_viewers: number;
    peak_viewers: number;
}

interface ListenerPoint {
    listeners: number;
    recorded_at: string;
}

const stationsStats = ref<StationStat[]>([]);
const channelsStats = ref<ChannelStat[]>([]);
const listenerHistory = ref<ListenerPoint[]>([]);
const selectedStation = ref<number | null>(null);
const loading = ref(true);
const chartLoading = ref(false);

const totalListeners = ref(0);
const totalViewers = ref(0);
const totalHours = ref(0);

async function fetchStats() {
    loading.value = true;
    try {
        const [stationRes, channelRes] = await Promise.all([
            axios.get('/api/stats/summary').catch(() => ({ data: {} })),
            axios.get('/api/stations').catch(() => ({ data: [] })),
        ]);

        const stations = Array.isArray(channelRes.data) ? channelRes.data : [];
        stationsStats.value = stations;
        totalListeners.value = stations.reduce((s: number, st: StationStat) => s + (st.current_listeners || 0), 0);
        totalHours.value = Math.round(stations.reduce((s: number, st: StationStat) => s + (st.total_listening_time || 0), 0) / 3600);

        if (stations.length > 0) {
            selectedStation.value = stations[0].id;
            fetchListenerHistory(stations[0].id);
        }
    } catch {
        // silently handle
    } finally {
        loading.value = false;
    }
}

async function fetchListenerHistory(stationId: number) {
    chartLoading.value = true;
    try {
        const { data } = await axios.get(`/api/stats/listeners/${stationId}`);
        listenerHistory.value = Array.isArray(data) ? data.slice(-24) : [];
    } catch {
        listenerHistory.value = [];
    } finally {
        chartLoading.value = false;
    }
}

function selectStation(id: number) {
    selectedStation.value = id;
    fetchListenerHistory(id);
}

function formatDuration(secs: number): string {
    if (!secs) return '0h';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function barHeight(listeners: number, max: number): string {
    if (!max) return '0%';
    return `${Math.max(4, (listeners / max) * 100)}%`;
}

function formatHour(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

onMounted(fetchStats);
</script>

<template>
    <Head title="Estadísticas - TuiStream" />

    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Rendimiento de tus emisoras</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="card">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Oyentes Totales</p>
                    <p class="text-2xl font-bold text-tuistream-600 dark:text-tuistream-400">{{ totalListeners }}</p>
                </div>
                <div class="card">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Espectadores TV</p>
                    <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ totalViewers }}</p>
                </div>
                <div class="card">
                    <p class="text-xs text-gray-500 dark:text-gray-400">Horas Totales</p>
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ totalHours }}h</p>
                </div>
            </div>

            <!-- Station Selector -->
            <div v-if="stationsStats.length > 1" class="flex gap-2 overflow-x-auto pb-1">
                <button
                    v-for="st in stationsStats"
                    :key="st.id"
                    @click="selectStation(st.id)"
                    :class="[
                        'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                        selectedStation === st.id
                            ? 'bg-tuistream-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    ]"
                >
                    {{ st.name }}
                </button>
            </div>

            <!-- Listeners Chart -->
            <div class="card">
                <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Oyentes (Últimas 24 horas)
                </h3>

                <div v-if="chartLoading" class="flex items-center justify-center py-16">
                    <svg class="animate-spin w-6 h-6 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>

                <div v-else-if="!listenerHistory.length" class="text-center py-12 text-gray-400 dark:text-gray-500">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Sin datos de oyentes aún
                </div>

                <div v-else class="flex items-end gap-1 h-32">
                    <div
                        v-for="(point, i) in listenerHistory"
                        :key="i"
                        class="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                        <div
                            class="w-full bg-tuistream-500 dark:bg-tuistream-400 rounded-t transition-all hover:bg-tuistream-600 dark:hover:bg-tuistream-300 min-h-[4px]"
                            :style="{ height: barHeight(point.listeners, Math.max(...listenerHistory.map(p => p.listeners), 1)) }"
                            :title="`${point.listeners} oyentes`"
                        ></div>
                        <span class="text-[10px] text-gray-400 mt-1 hidden sm:block">{{ formatHour(point.recorded_at) }}</span>
                    </div>
                </div>
            </div>

            <!-- Stations Table -->
            <div v-if="stationsStats.length" class="card overflow-hidden !p-0">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 dark:bg-gray-800/50 text-left">
                            <tr>
                                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Emisora</th>
                                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Oyentes</th>
                                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Pico</th>
                                <th class="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Tiempo Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            <tr v-for="st in stationsStats" :key="st.id">
                                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ st.name }}</td>
                                <td class="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">{{ st.current_listeners || 0 }}</td>
                                <td class="px-4 py-3 text-right font-mono text-purple-600 dark:text-purple-400">{{ st.peak_listeners || 0 }}</td>
                                <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{{ formatDuration(st.total_listening_time || 0) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!loading && !stationsStats.length" class="card text-center py-16">
                <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">Sin emisoras</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">No tienes emisoras asignadas aún</p>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
