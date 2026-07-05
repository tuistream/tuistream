<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    title: string;
    value: string | number;
    change?: string | number;
    changeType?: 'up' | 'down' | 'neutral';
    icon?: string;
    iconBg?: string;
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    changeType: 'neutral',
    iconBg: 'bg-tuistream-100 dark:bg-tuistream-900/40',
    loading: false,
});

const changeColor = computed(() => {
    switch (props.changeType) {
        case 'up': return 'text-green-500';
        case 'down': return 'text-red-500';
        default: return 'text-gray-400';
    }
});
</script>

<template>
    <div class="card cursor-default">
        <div v-if="loading" class="animate-pulse space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div v-else class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">{{ title }}</p>
                <p class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ value }}</p>
                <p v-if="change !== undefined" :class="['text-xs font-medium mt-1.5', changeColor]">
                    <span v-if="changeType === 'up'">↑ </span>
                    <span v-else-if="changeType === 'down'">↓ </span>
                    {{ change }}
                </p>
            </div>
            <div v-if="icon" :class="['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg]">
                <svg v-if="icon === 'activity'" class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <svg v-else-if="icon === 'users'" class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else-if="icon === 'play'" class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-5 h-5 text-tuistream-600 dark:text-tuistream-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
        </div>
    </div>
</template>
