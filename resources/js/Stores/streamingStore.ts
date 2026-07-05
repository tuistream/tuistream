import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export const useStreamingStore = defineStore('streaming', () => {
    const activeStations = ref<number>(0);
    const totalListeners = ref<number>(0);
    const activeChannels = ref<number>(0);
    const totalViewers = ref<number>(0);
    const cpuUsage = ref<number>(0);
    const ramUsage = ref<number>(0);
    const diskUsage = ref<number>(0);
    const networkIn = ref<number>(0);
    const networkOut = ref<number>(0);

    const isConnected = ref(false);
    let echo: Echo | null = null;

    function connect() {
        const token = document.head.querySelector('meta[name="reverb-key"]')?.getAttribute('content');
        const host = document.head.querySelector('meta[name="reverb-host"]')?.getAttribute('content');

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

        // Listen for server stats
        echo.channel('server-stats')
            .listen('.stats-updated', (data: any) => {
                cpuUsage.value = data.cpu_usage;
                ramUsage.value = data.ram_usage;
                diskUsage.value = data.disk_usage;
                networkIn.value = data.network_in;
                networkOut.value = data.network_out;
                activeStations.value = data.active_stations;
                totalListeners.value = data.active_listeners;
                activeChannels.value = data.active_channels;
                totalViewers.value = data.active_viewers;
            });
    }

    function disconnect() {
        echo?.disconnect();
        isConnected.value = false;
    }

    return {
        activeStations,
        totalListeners,
        activeChannels,
        totalViewers,
        cpuUsage,
        ramUsage,
        diskUsage,
        networkIn,
        networkOut,
        isConnected,
        connect,
        disconnect,
    };
});
