import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { router } from '@inertiajs/vue3';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null);
    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.roles?.[0]?.name === 'admin');
    const isClient = computed(() => user.value?.roles?.[0]?.name === 'client');

    function setUser(newUser: any) {
        user.value = newUser;
    }

    function clearUser() {
        user.value = null;
    }

    async function logout() {
        router.post('/logout', {}, {
            onSuccess: () => clearUser(),
        });
    }

    return {
        user,
        isAuthenticated,
        isAdmin,
        isClient,
        setUser,
        clearUser,
        logout,
    };
});
