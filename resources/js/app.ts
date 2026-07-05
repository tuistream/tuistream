import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createPinia } from 'pinia';
import { ZiggyVue } from 'ziggy-js';

// Initialize theme BEFORE Vue mounts to prevent FOUC (flash of unstyled content)
(function initThemeBeforeMount() {
    const STORAGE_KEY = 'tuistream-theme';
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const shouldUseDark = stored === 'dark'
            || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (shouldUseDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light');
    } catch {
        // Fall back to light mode if localStorage or matchMedia is unavailable.
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

const appName = import.meta.env.VITE_APP_NAME || 'TuiStream';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue'),
        ),
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) })
            .use(plugin)
            .use(createPinia())
            .use(ZiggyVue);

        app.mount(el);
        return app;
    },
    progress: {
        color: '#6366F1',
        showSpinner: true,
    },
});
