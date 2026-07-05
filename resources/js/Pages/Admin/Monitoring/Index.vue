<script setup lang="ts">
import { computed } from 'vue';
import { usePage, Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const page = usePage();
const stats = computed(() => page.props.stats || {});
const activeStations = computed(() => stats.value.active_stations_list || []);

function formatBytes(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Monitoreo</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Estado en tiempo real del servidor y transmisiones</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-600">Actualizando cada 30s</span>
                </div>
            </div>

            <!-- System Status -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="card">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center">
                            <svg class="w-4 h-4 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Streams</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.active_streams || 0 }}</p>
                    <div class="flex items-center gap-1 mt-2">
                        <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ stats.active_listeners || 0 }} oyentes totales</span>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">TV</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.active_channels || 0 }}</p>
                    <div class="flex items-center gap-1 mt-2">
                        <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ stats.tv_viewers || 0 }} viewers totales</span>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Clientes</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.active_clients || 0 }}</p>
                    <div class="flex items-center gap-1 mt-2">
                        <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">Clientes en línea</span>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Disco</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.disk_usage || 0 }}%</p>
                    <div class="flex items-center gap-1 mt-2">
                        <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatBytes(stats.disk_used) }} / {{ formatBytes(stats.disk_total) }}</span>
                    </div>
                </div>
            </div>

            <!-- Active Stations -->
            <div class="card">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200">Emisoras en Vivo</h3>
                    <Link href="/admin/stations" class="text-xs text-tuistream-600 dark:text-tuistream-400 hover:underline font-medium">Ver todas</Link>
                </div>

                <div v-if="activeStations.length" class="space-y-3">
                    <div
                        v-for="station in activeStations"
                        :key="station.id"
                        class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ station.name }}</p>
                            <p class="text-xs text-gray-400">{{ station.client?.name }} · {{ station.listeners || 0 }} oyentes</p>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                            <span class="badge badge-success">En vivo</span>
                            <div class="text-right hidden sm:block">
                                <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ station.bitrate || 128 }} kbps</p>
                                <p class="text-xs text-gray-400">{{ station.codec || 'MP3' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center py-10">
                    <div class="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No hay emisoras en vivo</p>
                    <p class="text-xs text-gray-400 mt-1">Las estaciones activas aparecerán aquí en tiempo real</p>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
