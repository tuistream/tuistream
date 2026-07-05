import { computed, watchEffect } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { useTheme } from '@/Composables/useTheme';

const STORAGE_KEY_LOGO = 'tuistream-logo-url';
const STORAGE_KEY_LOGO_DARK = 'tuistream-logo-url-dark';

function getStoredUrl(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setFavicon(url: string | null): void {
    if (typeof document === 'undefined') return;

    // Try to find existing favicon link (by ID first, then by rel)
    let link = document.querySelector<HTMLLinkElement>('#dynamic-favicon')
        || document.querySelector<HTMLLinkElement>('link[rel="icon"]');

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.id = 'dynamic-favicon';
        document.head.appendChild(link);
    }

    // If no custom URL provided, remove the href to let browser use default (none)
    if (!url) {
        link.href = '';
        return;
    }

    link.href = url;
}

export function useLogo() {
    const page = usePage();
    const { isDark } = useTheme();

    const branding = computed(() => (page.props as any).branding || {});

    const defaultLogoUrl = computed(() => {
        const stored = getStoredUrl(STORAGE_KEY_LOGO);
        return stored || branding.value.logo_url || null;
    });

    const defaultLogoDarkUrl = computed(() => {
        const stored = getStoredUrl(STORAGE_KEY_LOGO_DARK);
        return stored || branding.value.logo_dark_url || null;
    });

    const activeLogoUrl = computed(() => {
        if (isDark.value) {
            return defaultLogoDarkUrl.value || defaultLogoUrl.value;
        }

        return defaultLogoUrl.value || defaultLogoDarkUrl.value;
    });

    const appName = computed(() => branding.value.app_name || 'TuiStream');
    const appDescription = computed(() => branding.value.app_description || 'Panel de Control de Streaming');
    const faviconUrl = computed(() => branding.value.favicon_url || defaultLogoUrl.value || null);

    function setLogoUrls(light: string | null, dark: string | null = null): void {
        if (typeof window === 'undefined') return;

        if (light) window.localStorage.setItem(STORAGE_KEY_LOGO, light);
        if (dark) window.localStorage.setItem(STORAGE_KEY_LOGO_DARK, dark);
        if (!light) window.localStorage.removeItem(STORAGE_KEY_LOGO);
        if (!dark) window.localStorage.removeItem(STORAGE_KEY_LOGO_DARK);
    }

    function clearCustomLogos(): void {
        if (typeof window === 'undefined') return;

        window.localStorage.removeItem(STORAGE_KEY_LOGO);
        window.localStorage.removeItem(STORAGE_KEY_LOGO_DARK);
    }

    watchEffect(() => {
        setFavicon(faviconUrl.value);
    });

    return {
        defaultLogoUrl,
        defaultLogoDarkUrl,
        activeLogoUrl,
        appName,
        appDescription,
        faviconUrl,
        setLogoUrls,
        clearCustomLogos,
    };
}
