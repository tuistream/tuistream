declare module 'ziggy-js' {
    interface Config {
        url: string;
        port: number | null;
        defaults: Record<string, unknown>;
        routes: Record<string, any>;
    }
}

declare module '@inertiajs/vue3' {
    export function usePage(): any;
    export function useForm(data?: Record<string, any>): any;
    export function router: any;
    export function Link(props: any): any;
    export function Head(props: any): any;
    export function createInertiaApp(opts: any): any;
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
