import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(false);

    function init() {
        const stored = localStorage.getItem('tuistream-theme');
        if (stored) {
            isDark.value = stored === 'dark';
        } else {
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        applyTheme();
    }

    function toggle() {
        isDark.value = !isDark.value;
        localStorage.setItem('tuistream-theme', isDark.value ? 'dark' : 'light');
        applyTheme();
    }

    function applyTheme() {
        document.documentElement.classList.toggle('dark', isDark.value);
    }

    return { isDark, init, toggle };
});
