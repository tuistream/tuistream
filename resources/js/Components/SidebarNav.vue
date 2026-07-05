<script setup lang="ts">
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const page = usePage();

interface NavItem {
    label: string;
    href: string;
    icon: string;
    activePattern?: string;
    badge?: string | number;
}

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', activePattern: 'dashboard' },
    { label: 'Emisoras', href: '/admin/stations', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', activePattern: 'stations' },
    { label: 'Canales TV', href: '/admin/tv-channels', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', activePattern: 'tv-channels' },
    { label: 'Live Streaming', href: '/admin/live-streaming', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M13 2L3 14h9l-2 8 10-12h-9l2-8z', activePattern: 'live-streaming' },
    { label: 'Clientes', href: '/admin/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', activePattern: 'clients' },
    { label: 'Biblioteca', href: '/admin/media', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', activePattern: 'media' },
    { label: 'Monitoreo', href: '/admin/monitoring', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', activePattern: 'monitoring' },
    { label: 'Auditoría', href: '/admin/audit-logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', activePattern: 'audit-logs' },
    { label: 'Configuración', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', activePattern: 'settings' },
    { label: 'API Docs', href: '/admin/api-docs', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', activePattern: 'api-docs' },
];

const clientNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/client/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', activePattern: 'dashboard' },
    { label: 'Mis Emisoras', href: '/client/stations', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', activePattern: 'stations' },
    { label: 'Mis Canales', href: '/client/tv-channels', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', activePattern: 'tv-channels' },
    { label: 'Biblioteca', href: '/client/media', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', activePattern: 'media' },
    { label: 'Estadísticas', href: '/client/statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', activePattern: 'statistics' },
    { label: 'Mi Perfil', href: '/client/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', activePattern: 'profile' },
];

const isAdmin = computed(() => {
    const roles = page.props.auth?.user?.roles;
    if (!roles?.length) return false;
    if (typeof roles[0] === 'string') return roles.includes('admin');
    return roles.some((r: any) => r.name === 'admin');
});

const navItems = computed(() => isAdmin.value ? adminNavItems : clientNavItems);

const isActive = (item: NavItem): boolean => {
    const currentPath = page.url;
    if (item.activePattern) {
        return currentPath.includes(item.activePattern);
    }
    return currentPath === item.href;
};
</script>

<template>
    <template v-for="item in navItems" :key="item.href">
        <Link
            :href="item.href"
            :class="[
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive(item)
                    ? 'bg-gradient-to-r from-tuistream-500 to-tuistream-600 text-white shadow-sm shadow-tuistream-500/25 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200'
            ]"
        >
            <!-- Active indicator dot -->
            <span
                v-if="isActive(item)"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full"
            />

            <svg
                class="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                :class="isActive(item) ? '' : 'group-hover:scale-110'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="item.icon" />
            </svg>
            <span class="text-sm whitespace-nowrap truncate hidden lg:block">{{ item.label }}</span>
        </Link>
    </template>
</template>
