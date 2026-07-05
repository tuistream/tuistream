/**
 * Notification store - global notification management with real-time support
 * Features: dropdown list, toast popups, unread count, Echo integration
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: Date;
    duration: number | null; // null = persistent (shown in dropdown only)
    link?: string;
    icon?: string;
}

export interface Toast extends AppNotification {
    duration: number; // auto-dismiss ms (0 = manual)
}

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref<AppNotification[]>([]);
    const toasts = ref<Toast[]>([]);
    const isConnected = ref(false);
    let echo: Echo | null = null;

    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

    function connect() {
        const token = document.head.querySelector('meta[name="reverb-key"]')?.getAttribute('content');
        const host = document.head.querySelector('meta[name="reverb-key"]')?.getAttribute('content') // Use same for ws-host

        if (!token || !host) return;

        (window as any).Pusher = Pusher;

        echo = new Echo({
            broadcaster: 'reverb',
            key: token,
            wsHost: host,
            wsPort: 6001,
            wssPort: 6001,
            forceTLS: true,
            enabledTransports: ['ws', 'wss'],
        });

        echo.connector.pusher.connection.bind('connected', () => {
            isConnected.value = true;
        });

        // Listen for platform notifications
        echo.channel('notifications')
            .listen('.notification.created', (data: any) => {
                add({
                    title: data.title || 'Nueva notificación',
                    message: data.message || '',
                    type: mapType(data.type),
                    duration: null,
                    link: data.link || undefined,
                });
            });

        // Listen for stream events
        echo.channel('server-stats')
            .listen('.stream.started', (data: any) => {
                showToast({
                    title: 'Stream iniciado',
                    message: `La estación "${data.station_name}" ha comenzado a transmitir`,
                    type: 'success',
                    duration: 5000,
                });
            })
            .listen('.stream.stopped', (data: any) => {
                showToast({
                    title: 'Stream detenido',
                    message: `La estación "${data.station_name}" ha detenido la transmisión`,
                    type: 'warning',
                    duration: 5000,
                });
            })
            .listen('.station.offline', (data: any) => {
                showToast({
                    title: 'Estación offline',
                    message: `La estación "${data.station_name}" está experimentando problemas`,
                    type: 'error',
                    duration: 8000,
                });
            })
            .listen('.viewer.joined', (data: any) => {
                showToast({
                    title: 'Nuevo espectador',
                    message: `Un nuevo usuario se ha conectado al canal`,
                    type: 'info',
                    duration: 3000,
                });
            });
    }

    function disconnect() {
        echo?.disconnect();
        isConnected.value = false;
    }

    function mapType(type?: string): NotificationType {
        switch (type) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'info';
        }
    }

    function generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function add(params: {
        title: string;
        message: string;
        type?: NotificationType;
        duration?: number | null;
        link?: string;
        icon?: string;
    }): string {
        const notification: AppNotification = {
            id: generateId(),
            title: params.title,
            message: params.message,
            type: params.type || 'info',
            read: false,
            createdAt: new Date(),
            duration: params.duration ?? null,
            link: params.link,
            icon: params.icon,
        };

        notifications.value.unshift(notification);

        // Keep max 50 notifications in dropdown
        if (notifications.value.length > 50) {
            notifications.value = notifications.value.slice(0, 50);
        }

        return notification.id;
    }

    function showToast(params: {
        title: string;
        message?: string;
        type?: NotificationType;
        duration?: number;
    }): string {
        const toast: Toast = {
            id: generateId(),
            title: params.title,
            message: params.message || '',
            type: params.type || 'info',
            read: false,
            createdAt: new Date(),
            duration: params.duration ?? 4000,
            link: undefined,
        };

        toasts.value.push(toast);

        // Auto-dismiss
        if (toast.duration > 0) {
            setTimeout(() => {
                dismissToast(toast.id);
            }, toast.duration);
        }

        // Keep max 5 toasts visible
        if (toasts.value.length > 5) {
            toasts.value = toasts.value.slice(-5);
        }

        return toast.id;
    }

    function dismissToast(id: string) {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }

    function remove(id: string) {
        notifications.value = notifications.value.filter(n => n.id !== id);
    }

    function markRead(id: string) {
        const notif = notifications.value.find(n => n.id === id);
        if (notif) notif.read = true;
    }

    function markAllRead() {
        notifications.value.forEach(n => { n.read = true; });
    }

    function clearAll() {
        notifications.value = [];
    }

    // Seed with welcome notifications on first load
    function seedWelcome() {
        if (notifications.value.length === 0) {
            notifications.value = [
                {
                    id: 'welcome-1',
                    title: 'Bienvenido a TuiStream',
                    message: 'Tu plataforma de streaming está lista. Explora tus emisoras y canales.',
                    type: 'success',
                    read: false,
                    createdAt: new Date(),
                    duration: null,
                },
                {
                    id: 'welcome-2',
                    title: 'AutoDJ activo',
                    message: 'El sistema AutoDJ está configurado y listo para gestionar tu programación.',
                    type: 'info',
                    read: false,
                    createdAt: new Date(Date.now() - 60000),
                    duration: null,
                },
            ];
        }
    }

    return {
        notifications,
        toasts,
        unreadCount,
        isConnected,
        connect,
        disconnect,
        add,
        showToast,
        dismissToast,
        remove,
        markRead,
        markAllRead,
        clearAll,
        seedWelcome,
    };
});
