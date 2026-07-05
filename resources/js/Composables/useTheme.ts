import { ref, onMounted } from 'vue';

const STORAGE_KEY = 'tuistream-theme';
const isDark = ref(false);
const isInitialized = ref(false);
let mediaQuery: MediaQueryList | null = null;
let mediaQueryListenerBound = false;

function getStoredTheme(): 'dark' | 'light' | null {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage.getItem(STORAGE_KEY) as 'dark' | 'light' | null;
    } catch {
        return null;
    }
}

function applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;

    if (dark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function saveTheme(theme: 'dark' | 'light'): void {
    if (typeof window === 'undefined') return;

    try {
        window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Ignore storage errors and still apply the theme in memory.
    }
}

function bindSystemPreferenceListener(): void {
    if (typeof window === 'undefined' || mediaQueryListenerBound) return;

    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
        if (!getStoredTheme()) {
            isDark.value = event.matches;
            applyTheme(isDark.value);
        }
    });

    mediaQueryListenerBound = true;
}

function initTheme(): void {
    if (isInitialized.value) return;

    const stored = getStoredTheme();
    if (stored) {
        isDark.value = stored === 'dark';
    } else {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    applyTheme(isDark.value);
    bindSystemPreferenceListener();
    isInitialized.value = true;
}

function toggleTheme(): void {
    isDark.value = !isDark.value;
    saveTheme(isDark.value ? 'dark' : 'light');
    applyTheme(isDark.value);
}

function setTheme(dark: boolean): void {
    isDark.value = dark;
    saveTheme(dark ? 'dark' : 'light');
    applyTheme(dark);
}

// Watch for external changes (e.g. other tabs)
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            const newVal = e.newValue as 'dark' | 'light' | null;
            if (newVal) {
                isDark.value = newVal === 'dark';
                applyTheme(isDark.value);
            } else {
                isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(isDark.value);
            }
        }
    });
}

export function useTheme() {
    onMounted(() => {
        if (!isInitialized.value) {
            initTheme();
        }
    });

    return {
        isDark,
        isInitialized,
        toggleTheme,
        setTheme,
        initTheme,
    };
}
