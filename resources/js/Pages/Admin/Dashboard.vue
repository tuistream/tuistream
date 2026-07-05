<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const page = usePage();
const stats = computed(() => page.props.stats || {});
const history = computed(() => stats.value.stat_history || []);
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function barColor(val: number) {
    if (val > 90) return 'bg-red-500';
    if (val > 70) return 'bg-orange-500';
    if (val > 50) return 'bg-yellow-500';
    return 'bg-green-500';
}

function chartMax(values: number[]): number {
    return Math.max(100, ...values, 1);
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function uptimePercent(): string {
    const cpu = stats.value.cpu_usage || 0;
    const ram = stats.value.ram_usage || 0;
    return ((100 - (cpu + ram) / 2)).toFixed(1);
}

onMounted(() => {
    refreshInterval.value = setInterval(() => {
        // In production this would re-fetch stats
    }, 30000);
});

onUnmounted(() => {
    if (refreshInterval.value) clearInterval(refreshInterval.value);
});
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Page Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Panel de administración de TuiStream</p>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Sistema activo
                </div>
            </div>

            <!-- Stats Grid - 2 cols on mobile, 4 on lg -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div class="card flex items-center gap-3 sm:block sm:text-center">
                    <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center sm:mx-auto flex-shrink-0">
                        <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <div class="sm:mt-2 min-w-0">
                        <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active_streams || 0 }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 sm:mt-0.5">Streams activos</p>
                    </div>
                </div>
                <div class="card flex items-center gap-3 sm:block sm:text-center">
                    <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center sm:mx-auto flex-shrink-0">
                        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </div>
                    <div class="sm:mt-2 min-w-0">
                        <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active_listeners || 0 }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 sm:mt-0.5">Oyentes online</p>
                    </div>
                </div>
                <div class="card flex items-center gap-3 sm:block sm:text-center">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center sm:mx-auto flex-shrink-0">
                        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="sm:mt-2 min-w-0">
                        <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active_channels || 0 }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 sm:mt-0.5">Canales TV online</p>
                    </div>
                </div>
                <div class="card flex items-center gap-3 sm:block sm:text-center">
                    <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center sm:mx-auto flex-shrink-0">
                        <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div class="sm:mt-2 min-w-0">
                        <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active_clients || 0 }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 sm:mt-0.5">Clientes activos</p>
                    </div>
                </div>
            </div>

            <!-- System Health Cards - stacked on mobile, grid on lg -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- CPU -->
                <div class="card">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">CPU</h3>
                        </div>
                        <span class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.cpu_usage || 0 }}%</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div :class="barColor(stats.cpu_usage)" class="h-2.5 rounded-full transition-all duration-700" :style="{ width: (stats.cpu_usage || 0) + '%' }" />
                    </div>
                    <p class="text-xs text-gray-400 mt-2">Procesador del servidor</p>
                </div>

                <!-- RAM -->
                <div class="card">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">RAM</h3>
                        </div>
                        <span class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.ram_usage || 0 }}%</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div :class="barColor(stats.ram_usage)" class="h-2.5 rounded-full transition-all duration-700" :style="{ width: (stats.ram_usage || 0) + '%' }" />
                    </div>
                    <p class="text-xs text-gray-400 mt-2">{{ formatBytes(stats.ram_used) }} / {{ formatBytes(stats.ram_total) }}</p>
                </div>

                <!-- Disk -->
                <div class="card">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Disco</h3>
                        </div>
                        <span class="text-xl font-bold text-gray-900 dark:text-white">{{ stats.disk_usage || 0 }}%</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div :class="barColor(stats.disk_usage)" class="h-2.5 rounded-full transition-all duration-700" :style="{ width: (stats.disk_usage || 0) + '%' }" />
                    </div>
                    <p class="text-xs text-gray-400 mt-2">{{ formatBytes(stats.disk_used) }} / {{ formatBytes(stats.disk_total) }}</p>
                </div>
            </div>

            <!-- Charts - full width on mobile, 2-col grid on lg -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- CPU History -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">CPU — Últimas 24 muestras</h3>
                    <div v-if="!history.length" class="text-center py-8 text-gray-400 text-sm">Recolectando datos...</div>
                    <div v-else class="flex items-end gap-0.5 h-28 sm:h-32">
                        <div
                            v-for="(point, i) in history"
                            :key="i"
                            class="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                            :class="point.cpu > 70 ? 'bg-red-500' : point.cpu > 40 ? 'bg-yellow-500' : 'bg-tuistream-500'"
                            :style="{ height: Math.max(4, (point.cpu / chartMax(history.map(h => h.cpu))) * 100) + '%' }"
                            :title="`${formatTime(point.time)}: CPU ${point.cpu}%`"
                        >
                            <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap hidden sm:block">{{ point.cpu }}%</span>
                        </div>
                    </div>
                </div>

                <!-- RAM History -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">RAM — Últimas 24 muestras</h3>
                    <div v-if="!history.length" class="text-center py-8 text-gray-400 text-sm">Recolectando datos...</div>
                    <div v-else class="flex items-end gap-0.5 h-28 sm:h-32">
                        <div
                            v-for="(point, i) in history"
                            :key="i"
                            class="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                            :class="point.ram > 70 ? 'bg-red-500' : point.ram > 40 ? 'bg-yellow-500' : 'bg-green-500'"
                            :style="{ height: Math.max(4, (point.ram / chartMax(history.map(h => h.ram))) * 100) + '%' }"
                            :title="`${formatTime(point.time)}: RAM ${point.ram}%`"
                        >
                            <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap hidden sm:block">{{ point.ram }}%</span>
                        </div>
                    </div>
                </div>

                <!-- Listeners History -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Oyentes — Últimas 24 muestras</h3>
                    <div v-if="!history.length" class="text-center py-8 text-gray-400 text-sm">Recolectando datos...</div>
                    <div v-else class="flex items-end gap-0.5 h-28 sm:h-32">
                        <div
                            v-for="(point, i) in history"
                            :key="i"
                            class="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group bg-blue-500"
                            :style="{ height: Math.max(4, (point.listeners / Math.max(1, ...history.map(h => h.listeners))) * 100) + '%' }"
                            :title="`${formatTime(point.time)}: ${point.listeners} oyentes`"
                        >
                            <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap hidden sm:block">{{ point.listeners }}</span>
                        </div>
                    </div>
                </div>

                <!-- Disk History -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Disco — Últimas 24 muestras</h3>
                    <div v-if="!history.length" class="text-center py-8 text-gray-400 text-sm">Recolectando datos...</div>
                    <div v-else class="flex items-end gap-0.5 h-28 sm:h-32">
                        <div
                            v-for="(point, i) in history"
                            :key="i"
                            class="flex-1 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer relative group"
                            :class="point.disk > 80 ? 'bg-red-500' : 'bg-orange-500'"
                            :style="{ height: Math.max(4, (point.disk / chartMax(history.map(h => h.disk))) * 100) + '%' }"
                            :title="`${formatTime(point.time)}: Disco ${point.disk}%`"
                        >
                            <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap hidden sm:block">{{ point.disk }}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Emisoras Recientes</h3>
                    <div v-if="stats.recent_stations?.length" class="space-y-2">
                        <div v-for="station in stats.recent_stations" :key="station.id" class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-9 h-9 rounded-lg bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0">
                                    <svg class="w-4 h-4 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ station.name }}</p>
                                    <p class="text-xs text-gray-400">{{ station.client?.name }}</p>
                                </div>
                            </div>
                            <span :class="station.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2">
                                {{ station.is_active ? 'Online' : 'Offline' }}
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-sm text-gray-400 text-center py-6">No hay emisoras registradas aún</p>
                </div>

                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Clientes Recientes</h3>
                    <div v-if="stats.recent_clients?.length" class="space-y-2">
                        <div v-for="client in stats.recent_clients" :key="client.id" class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div class="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                                <span class="text-purple-600 dark:text-purple-400 font-semibold text-sm">{{ client.name?.charAt(0)?.toUpperCase() }}</span>
                            </div>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ client.name }}</p>
                                <p class="text-xs text-gray-400 truncate">{{ client.email }}</p>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-sm text-gray-400 text-center py-6">No hay clientes registrados aún</p>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
