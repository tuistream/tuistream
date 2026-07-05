<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePage, Link, router } from '@inertiajs/vue3';
import { useTheme } from '@/Composables/useTheme';
import { useLogo } from '@/Composables/useLogo';
import { useNotificationStore } from '@/Stores/notificationStore';

const page = usePage();
const notifStore = useNotificationStore();
const { isDark, toggleTheme } = useTheme();
const { activeLogoUrl, appName } = useLogo();

const user = computed(() => page.props.auth?.user);
const impersonatedBy = computed(() => page.props.auth?.user?.impersonated_by);

// Sidebar state
const isSidebarCollapsed = ref(false);
const isMobileMenuOpen = ref(false);

// Notification state
const showNotifications = ref(false);

function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function toggleNotifications() {
    showNotifications.value = !showNotifications.value;
}

function closeNotifications() {
    showNotifications.value = false;
}

function markAllRead() {
    notifStore.markAllRead();
    showNotifications.value = false;
}

function logout() {
    router.post('/logout');
}

function stopImpersonating() {
    router.post('/admin/stop-impersonating');
}

function formatNotifTime(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString('es-MX', { dateStyle: 'short' });
}

function notifIcon(type: string) {
    switch (type) {
        case 'success': return 'M5 13l4 4L19 7';
        case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
        case 'error': return 'M6 18L18 6M6 6l12 12';
        default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
}

function notifBgColor(type: string) {
    switch (type) {
        case 'success': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        case 'warning': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
        case 'error': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
        default: return 'bg-tuistream-100 dark:bg-tuistream-900/30 text-tuistream-600 dark:text-tuistream-400';
    }
}

onMounted(() => {
    notifStore.seedWelcome();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <!-- Sidebar -->
        <aside
            :class="[
                'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out safe-left',
                isSidebarCollapsed ? 'w-[68px]' : 'w-64',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            ]"
        >
            <!-- Logo -->
            <div class="flex items-center justify-between h-16 px-3 border-b border-gray-100 dark:border-gray-800">
                <Link href="/dashboard" class="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                    <img
                        v-if="activeLogoUrl"
                        :src="activeLogoUrl"
                        :alt="appName"
                        class="h-9 w-auto max-w-[144px] object-contain flex-shrink-0"
                    />
                    <div v-else class="w-9 h-9 bg-gradient-to-br from-tuistream-500 to-tuistream-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span class="text-white font-bold text-lg leading-none">{{ appName?.charAt(0) || 'T' }}</span>
                    </div>
                    <span
                        v-show="!isSidebarCollapsed && !activeLogoUrl"
                        class="font-bold text-base text-gray-900 dark:text-white whitespace-nowrap truncate"
                    >
                        {{ appName }}
                    </span>
                </Link>
                <button
                    @click="toggleSidebar"
                    class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors flex-shrink-0"
                >
                    <svg class="w-4 h-4 transition-transform duration-200" :class="isSidebarCollapsed ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
                <slot name="nav" />
            </nav>

            <!-- User Footer -->
            <div class="p-2 border-t border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-tuistream-500 to-tuistream-700 flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-semibold text-xs leading-none">
                            {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                        </span>
                    </div>
                    <div v-show="!isSidebarCollapsed" class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user?.name }}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 truncate capitalize">
                            {{ user?.roles?.[0]?.name || 'Usuario' }}
                        </p>
                    </div>
                    <button
                        @click="logout"
                        class="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all"
                        title="Cerrar sesión"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Mobile overlay -->
        <Transition name="fade">
            <div
                v-if="isMobileMenuOpen"
                @click="isMobileMenuOpen = false"
                class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
        </Transition>

        <!-- Main Content -->
        <div
            :class="[
                'min-h-screen transition-all duration-300 ease-in-out',
                isSidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'
            ]"
        >
            <!-- Top Bar -->
            <header class="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 safe-top">
                <div class="flex items-center justify-between h-14 px-4">
                    <!-- Mobile menu button -->
                    <button
                        @click="isMobileMenuOpen = !isMobileMenuOpen"
                        class="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 touch-target transition-colors"
                        aria-label="Menu"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <!-- Page title (mobile) -->
                    <div class="flex items-center gap-2 lg:hidden">
                        <img
                            v-if="activeLogoUrl"
                            :src="activeLogoUrl"
                            :alt="appName"
                            class="h-6 w-auto max-w-[96px] object-contain"
                        />
                        <template v-else>
                            <div class="w-6 h-6 bg-tuistream-600 rounded-md flex items-center justify-center">
                                <span class="text-white font-bold text-xs">{{ appName?.charAt(0) || 'T' }}</span>
                            </div>
                            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ appName }}</span>
                        </template>
                    </div>

                    <div class="flex items-center gap-1 sm:gap-2 ml-auto">
                        <!-- Theme Toggle -->
                        <button
                            @click="toggleTheme"
                            class="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all touch-target active:scale-95"
                            :title="isDark ? 'Modo claro' : 'Modo oscuro'"
                            aria-label="Cambiar tema"
                        >
                            <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </button>

                        <!-- Notifications -->
                        <div class="relative">
                            <button
                                @click="toggleNotifications"
                                class="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all touch-target active:scale-95"
                                title="Notificaciones"
                                aria-label="Notificaciones"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span v-if="notifStore.unreadCount" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            </button>

                            <!-- Notifications Dropdown -->
                            <Transition name="dropdown">
                                <div v-if="showNotifications" class="fixed inset-0 z-40" @click.self="closeNotifications">
                                    <div
                                        class="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden"
                                        style="max-height: calc(100vh - 80px);"
                                    >
                                        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                            <div class="flex items-center gap-2">
                                                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                                                <span v-if="notifStore.unreadCount" class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                                    {{ notifStore.unreadCount }}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <button
                                                    v-if="notifStore.unreadCount"
                                                    @click="markAllRead"
                                                    class="text-xs text-tuistream-600 hover:text-tuistream-700 dark:text-tuistream-400 font-medium px-2 py-2 rounded-lg hover:bg-tuistream-50 dark:hover:bg-tuistream-900/20 transition-colors min-h-[44px] flex items-center"
                                                >
                                                    Marcar leídas
                                                </button>
                                                <button
                                                    @click="closeNotifications"
                                                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors touch-target"
                                                >
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="overflow-y-auto" style="max-height: 400px;">
                                            <div v-if="!notifStore.notifications.length" class="flex flex-col items-center justify-center py-12 px-4 text-center">
                                                <svg class="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                                <p class="text-sm font-medium text-gray-400 dark:text-gray-500">Sin notificaciones</p>
                                            </div>
                                            <div
                                                v-for="notif in notifStore.notifications"
                                                :key="notif.id"
                                                @click="notifStore.markRead(notif.id)"
                                                :class="[
                                                    'flex gap-3 px-4 py-3 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                    !notif.read ? 'bg-tuistream-50/40 dark:bg-tuistream-900/10' : ''
                                                ]"
                                            >
                                                <div :class="['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', notifBgColor(notif.type)]">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" :d="notifIcon(notif.type)" />
                                                    </svg>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex items-start justify-between gap-2">
                                                        <p class="text-sm font-medium text-gray-900 dark:text-white leading-tight">{{ notif.title }}</p>
                                                        <span v-if="!notif.read" class="w-2 h-2 bg-tuistream-500 rounded-full flex-shrink-0 mt-1"></span>
                                                    </div>
                                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{{ notif.message }}</p>
                                                    <p class="text-xs text-gray-400 dark:text-gray-600 mt-1">{{ formatNotifTime(notif.createdAt) }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Impersonation Banner -->
            <div
                v-if="impersonatedBy"
                class="sticky top-14 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md text-sm"
            >
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Viendo como <strong>{{ user?.name }}</strong> — Admin: {{ impersonatedBy.name }}</span>
                </div>
                <button
                    @click="stopImpersonating"
                    class="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 min-h-[44px] flex items-center"
                >
                    Regresar a Admin
                </button>
            </div>

            <!-- Toast Notifications -->
            <div class="fixed bottom-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-32px)] safe-bottom" aria-live="polite" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
                <TransitionGroup name="toast">
                    <div
                        v-for="toast in notifStore.toasts"
                        :key="toast.id"
                        :class="[
                            'flex items-start gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-sm',
                            toast.type === 'success' ? 'bg-green-50/95 dark:bg-green-900/80 border-green-200 dark:border-green-700' :
                            toast.type === 'warning' ? 'bg-amber-50/95 dark:bg-amber-900/80 border-amber-200 dark:border-amber-700' :
                            toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-900/80 border-red-200 dark:border-red-700' :
                            'bg-white/95 dark:bg-gray-900/90 border-gray-200 dark:border-gray-700'
                        ]"
                    >
                        <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', notifBgColor(toast.type)]">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" :d="notifIcon(toast.type)" />
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{{ toast.title }}</p>
                            <p v-if="toast.message" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{{ toast.message }}</p>
                        </div>
                        <button
                            @click="notifStore.dismissToast(toast.id)"
                            class="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 transition-colors touch-target"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </TransitionGroup>
            </div>

            <!-- Page Content -->
            <main class="p-4 sm:p-6 lg:p-8 safe-bottom" style="padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));">
                <slot />
            </main>
        </div>
    </div>
</template>

<style scoped>
/* Fade transition for mobile overlay */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* Dropdown slide transition */
.dropdown-enter-active {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
    transition: all 0.15s ease-in;
}
.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
}

/* Toast slide transition */
.toast-enter-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
    transition: all 0.2s ease-in;
}
.toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
}
.toast-leave-to {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
}
.toast-move {
    transition: transform 0.3s ease;
}

/* Safe area for mobile */
.safe-top {
    padding-top: env(safe-area-inset-top, 0px);
}

/* Touch targets - minimum 44x44 for mobile accessibility */
.touch-target {
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Scrollbar styling */
.scrollbar-thin::-webkit-scrollbar {
    width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
}
.dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #374151;
}
</style>
