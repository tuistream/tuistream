/**
 * Notification composable - integrates with Pinia store for global notifications
 */
import { computed, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '@/Stores/notificationStore';

export function useNotifications() {
    const store = useNotificationStore();

    onMounted(() => {
        store.connect();
    });

    return {
        notifications: computed(() => store.notifications),
        unreadCount: computed(() => store.unreadCount),
        toasts: computed(() => store.toasts),
        add: store.add.bind(store),
        remove: store.remove.bind(store),
        markRead: store.markRead.bind(store),
        markAllRead: store.markAllRead.bind(store),
        showToast: store.showToast.bind(store),
    };
}
