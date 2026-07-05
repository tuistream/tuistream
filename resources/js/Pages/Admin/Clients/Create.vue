<script setup lang="ts">
import { ref } from 'vue';
import { router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const submitting = ref(false);
const error = ref('');

const form = ref({
    name: '',
    email: '',
    password: '',
    timezone: 'America/Mexico_City',
});

const timezones = [
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Buenos_Aires',
    'America/Caracas',
    'America/Guatemala',
    'America/Panama',
    'America/Santo_Domingo',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'UTC',
];

async function submit() {
    error.value = '';

    if (!form.value.name.trim()) { error.value = 'El nombre es obligatorio'; return; }
    if (!form.value.email.trim()) { error.value = 'El email es obligatorio'; return; }
    if (!form.value.password || form.value.password.length < 8) { error.value = 'La contraseña debe tener al menos 8 caracteres'; return; }

    submitting.value = true;
    try {
        await axios.post('/api/clients', form.value);
        router.visit('/admin/clients');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al crear el cliente';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

function goBack() {
    router.visit('/admin/clients');
}
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6 max-w-xl">
            <!-- Header -->
            <div class="flex items-center gap-4">
                <button
                    @click="goBack"
                    class="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Cliente</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea una cuenta para un nuevo cliente</p>
                </div>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
            </div>

            <!-- Form -->
            <div class="card">
                <form @submit.prevent="submit" class="space-y-6">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Nombre completo <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            placeholder="Ej: Juan Pérez"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Email -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Correo electrónico <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.email"
                            type="email"
                            placeholder="cliente@ejemplo.com"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Password -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Contraseña <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.password"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                        />
                        <p class="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
                    </div>

                    <!-- Timezone -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Zona horaria</label>
                        <div class="relative">
                            <select
                                v-model="form.timezone"
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all appearance-none"
                            >
                                <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                            </select>
                            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            :disabled="submitting"
                            class="flex-1 sm:flex-none px-6 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span v-if="submitting" class="inline-flex items-center gap-2">
                                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Creando...
                            </span>
                            <span v-else>Crear Cliente</span>
                        </button>
                        <button
                            type="button"
                            @click="goBack"
                            class="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
