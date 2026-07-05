<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { useTheme } from '@/Composables/useTheme';
import { useLogo } from '@/Composables/useLogo';

const { isDark, toggleTheme } = useTheme();
const { activeLogoUrl, appName, appDescription } = useLogo();
</script>

<template>
    <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-tuistream-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-8 sm:py-12">
        <!-- Decorative background blobs -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-24 -right-24 w-96 h-96 bg-tuistream-200/30 dark:bg-tuistream-900/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
        </div>

        <div class="relative z-10 w-full max-w-md">
            <!-- Logo and branding -->
            <div class="text-center mb-8">
                <Link href="/" class="inline-flex flex-col items-center gap-3">
                    <img
                        v-if="activeLogoUrl"
                        :src="activeLogoUrl"
                        :alt="appName"
                        class="h-16 w-auto max-w-[220px] object-contain"
                    />
                    <div v-else class="w-16 h-16 bg-gradient-to-br from-tuistream-500 via-tuistream-600 to-tuistream-700 rounded-2xl flex items-center justify-center shadow-lg shadow-tuistream-500/25 dark:shadow-tuistream-500/10">
                        <span class="text-white font-bold text-3xl leading-none tracking-tight">{{ appName?.charAt(0) || 'T' }}</span>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ appName }}</h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ appDescription }}</p>
                    </div>
                </Link>
            </div>

            <!-- Card -->
            <div class="card border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-gray-900/20">
                <slot />
            </div>

            <!-- Footer -->
            <div class="mt-6 flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
                <span>{{ appName }} v1.0</span>
                <!-- Theme toggle on login page -->
                <button
                    @click="toggleTheme"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg v-if="isDark" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>{{ isDark ? 'Modo claro' : 'Modo oscuro' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>
