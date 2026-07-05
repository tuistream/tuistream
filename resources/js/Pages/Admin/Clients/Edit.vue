<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface Client {
    id: number;
    name: string;
    email: string;
    timezone: string | null;
    is_active: boolean;
    is_suspended: boolean;
    suspended_at: string | null;
    suspended_reason: string | null;
    last_login_at: string | null;
    last_login_ip: string | null;
    created_at: string;
    stations: any[];
    channels: any[];
}

const page = usePage();
const clientId = computed(() => {
    const parts = page.url.split('/');
    return parseInt(parts[parts.length - 1]);
});

const client = ref<Client | null>(null);
const loading = ref(true);
const submitting = ref(false);
const toggling = ref(false);
const error = ref('');

const form = ref({
    name: '',
    email: '',
    password: '',
    timezone: '',
});

const timezones = [
    'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago',
    'America/Buenos_Aires', 'America/Caracas', 'America/Guatemala', 'America/Panama',
    'America/Santo_Domingo', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/Madrid', 'Europe/London', 'Europe/Paris',
    'Europe/Berlin', 'UTC',
];

async function fetchClient() {
    loading.value = true;
    try {
        const { data } = await axios.get(`/api/clients/${clientId.value}`);
        client.value = data;
        form.value = {
            name: data.name,
            email: data.email,
            password: '',
            timezone: data.timezone || 'America/Mexico_City',
        };
    } catch (e) {
        error.value = 'Error al cargar el cliente';
    } finally {
        loading.value = false;
    }
}

async function submit() {
    error.value = '';
    if (!form.value.name.trim()) { error.value = 'El nombre es obligatorio'; return; }
    if (!form.value.email.trim()) { error.value = 'El email es obligatorio'; return; }
    if (form.value.password && form.value.password.length < 8) { error.value = 'La contraseña debe tener al menos 8 caracteres'; return; }

    submitting.value = true;
    try {
        const payload: any = { name: form.value.name, email: form.value.email, timezone: form.value.timezone };
        if (form.value.password) payload.password = form.value.password;
        await axios.put(`/api/clients/${clientId.value}`, payload);
        router.visit('/admin/clients');
    } catch (e: any) {
        const msg = e.response?.data?.message || 'Error al actualizar';
        error.value = typeof msg === 'object' ? Object.values(msg).flat().join(', ') : msg;
    } finally {
        submitting.value = false;
    }
}

async function toggleSuspend() {
    if (!client.value) return;
    toggling.value = true;
    try {
        if (client.value.is_suspended) {
            await axios.post(`/api/clients/${client.value.id}/unsuspend`);
        } else {
            const reason = prompt('Motivo de la suspensión (opcional):') || '';
            await axios.post(`/api/clients/${client.value.id}/suspend`, { reason });
        }
        await fetchClient();
    } catch (e) {
        console.error('Error toggling suspend:', e);
    } finally {
        toggling.value = false;
    }
}

function goBack() {
    router.visit('/admin/clients');
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateStr: string | null) {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'medium' });
}

onMounted(fetchClient);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6 max-w-2xl">
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Editar Cliente</h2>
                    <p v-if="client" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ client.name }} —
                        <span :class="client.is_suspended ? 'text-red-600' : 'text-green-600'">
                            {{ client.is_suspended ? 'Suspendido' : 'Activo' }}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
            </div>

            <template v-if="client">
                <!-- Stats Cards -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="card text-center py-4">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ client.stations?.length || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Emisoras</p>
                    </div>
                    <div class="card text-center py-4">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ client.channels?.length || 0 }}</p>
                        <p class="text-xs text-gray-400 mt-1">Canales TV</p>
                    </div>
                    <div class="card text-center py-4">
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatDate(client.created_at) }}</p>
                        <p class="text-xs text-gray-400 mt-1">Creado</p>
                    </div>
                    <div class="card text-center py-4">
                        <p class="text-lg font-bold text-gray-900 dark:text-white truncate px-2">{{ formatDate(client.last_login_at) !== '—' ? 'Activo' : 'Nunca' }}</p>
                        <p class="text-xs text-gray-400 mt-1">Último acceso</p>
                    </div>
                </div>

                <!-- Suspend / Unsuspend Card -->
                <div
                    :class="[
                        'card border-2',
                        client.is_suspended
                            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    ]"
                >
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-semibold" :class="client.is_suspended ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'">
                                {{ client.is_suspended ? '🔒 Cliente Suspendido' : '✅ Cliente Activo' }}
                            </p>
                            <p v-if="client.is_suspended && client.suspended_reason" class="text-xs text-red-600 dark:text-red-400 mt-1">
                                Motivo: {{ client.suspended_reason }}
                            </p>
                            <p v-if="client.is_suspended && client.suspended_at" class="text-xs text-red-500 mt-0.5">
                                Desde: {{ formatDateTime(client.suspended_at) }}
                            </p>
                            <p v-if="client.last_login_at" class="text-xs text-gray-400 mt-1">
                                Último acceso: {{ formatDateTime(client.last_login_at) }}
                                <span v-if="client.last_login_ip" class="ml-1">(IP: {{ client.last_login_ip }})</span>
                            </p>
                        </div>
                        <div class="flex gap-2">
                            <button
                                @click="router.post(`/admin/impersonate/${client.id}`)"
                                :disabled="client.is_suspended"
                                class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <span class="inline-flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Ingresar como Cliente
                                </span>
                            </button>
                            <button
                                @click="toggleSuspend"
                                :disabled="toggling"
                                :class="[
                                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50',
                                    client.is_suspended
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                ]"
                            >
                                <span v-if="toggling" class="inline-flex items-center gap-2">
                                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Procesando...
                                </span>
                                <span v-else>{{ client.is_suspended ? 'Reactivar Cliente' : 'Suspender Cliente' }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Edit Form -->
                <div class="card">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Editar información</h3>
                    <form @submit.prevent="submit" class="space-y-6">
                        <!-- Name -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nombre completo <span class="text-red-500">*</span>
                            </label>
                            <input
                                v-model="form.name"
                                type="text"
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
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
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <!-- Password -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Nueva contraseña <span class="text-xs text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <input
                                v-model="form.password"
                                type="password"
                                placeholder="Dejar vacío para no cambiar"
                                class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            />
                            <p class="text-xs text-gray-400 mt-1">Mínimo 8 caracteres. Dejar vacío para mantener la actual.</p>
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
                                    Guardando...
                                </span>
                                <span v-else>Guardar Cambios</span>
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
            </template>
        </div>
    </AuthenticatedLayout>
</template>
