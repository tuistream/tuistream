<script setup lang="ts">
import { computed } from 'vue';
import { usePage, Link } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const page = usePage();
const stats = computed(() => page.props.stats || {});
const stations = computed(() => page.props.stations || []);
const tvChannels = computed(() => page.props.tv_channels || []);

function formatDuration(secs: number): string {
    if (!secs) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function listenerChange() {
    const current = stats.value.active_listeners || 0;
    const prev = stats.value.prev_listeners || 0;
    if (!prev) return null;
    const pct = ((current - prev) / prev * 100).toFixed(1);
    return parseFloat(pct);
}
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Welcome Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        Hola, {{ page.props.auth?.user?.name?.split(' ')[0] || 'Usuario' }} 👋
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen de tu actividad de streaming</p>
                </div>
                <Link
                    href="/client/stations/create"
                    class="btn-primary inline-flex items-center gap-2 justify-center text-sm"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva Emisora
                </Link>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div class="card">
                    <div class="flex items-center gap-2.5 sm:flex-col sm:text-center">
                        <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0 sm:mb-1">
                            <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_streams || 0 }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Emisoras</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2.5 sm:flex-col sm:text-center">
                        <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0 sm:mb-1">
                            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.active_listeners || 0 }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Oyentes ahora</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2.5 sm:flex-col sm:text-center">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 sm:mb-1">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total_tv_channels || 0 }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Canales TV</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="flex items-center gap-2.5 sm:flex-col sm:text-center">
                        <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 sm:mb-1">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{{ formatDuration(stats.total_broadcast_time) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Tiempo total</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Emisoras y Canales Activos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Emisoras -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Mis Emisoras</h3>
                        <Link href="/client/stations" class="text-xs text-tuistream-600 dark:text-tuistream-400 hover:underline font-medium">
                            Ver todas
                        </Link>
                    </div>
                    <div v-if="stations.length" class="space-y-2">
                        <div
                            v-for="station in stations.slice(0, 4)"
                            :key="station.id"
                            class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                            <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ station.name }}</p>
                                <p class="text-xs text-gray-400">{{ station.current_listeners || 0 }} oyentes</p>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span :class="station.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium">
                                    {{ station.is_active ? 'Online' : 'Offline' }}
                                </span>
                                <Link
                                    :href="`/client/stations/${station.id}`"
                                    class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-tuistream-100 dark:bg-tuistream-900/40 text-tuistream-600 dark:text-tuistream-400 transition-all"
                                >
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8">
                        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">No tienes emisoras aún</p>
                        <Link href="/client/stations/create" class="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Crear mi primera emisora
                        </Link>
                    </div>
                </div>

                <!-- Canales TV -->
                <div class="card">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Mis Canales TV</h3>
                        <Link href="/client/tv-channels" class="text-xs text-tuistream-600 dark:text-tuistream-400 hover:underline font-medium">
                            Ver todos
                        </Link>
                    </div>
                    <div v-if="tvChannels.length" class="space-y-2">
                        <div
                            v-for="channel in tvChannels.slice(0, 4)"
                            :key="channel.id"
                            class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ channel.name }}</p>
                                <p class="text-xs text-gray-400">{{ channel.current_viewers || 0 }} viewers</p>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <span :class="channel.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'" class="px-2.5 py-1 rounded-full text-xs font-medium">
                                    {{ channel.is_active ? 'Live' : 'Offline' }}
                                </span>
                                <Link
                                    :href="`/client/tv-channels/${channel.id}`"
                                    class="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all"
                                >
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8">
                        <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">No tienes canales TV aún</p>
                        <Link href="/client/tv-channels/create" class="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Crear mi primer canal
                        </Link>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Acciones Rápidas</h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link
                        href="/client/stations/create"
                        class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-tuistream-300 dark:hover:border-tuistream-600 hover:bg-tuistream-50 dark:hover:bg-tuistream-900/10 transition-all text-center group"
                    >
                        <div class="w-10 h-10 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Nueva Emisora</span>
                    </Link>
                    <Link
                        href="/client/tv-channels/create"
                        class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-center group"
                    >
                        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Nuevo Canal TV</span>
                    </Link>
                    <Link
                        href="/client/media"
                        class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all text-center group"
                    >
                        <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Subir Media</span>
                    </Link>
                    <Link
                        href="/client/statistics"
                        class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all text-center group"
                    >
                        <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Estadísticas</span>
                    </Link>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
