<script setup lang="ts">
import { ref, computed } from 'vue';
import { Head, usePage, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const page = usePage();
const user = computed(() => page.props.auth?.user || {});

const activeTab = ref<'profile' | 'security'>('profile');

const nameForm = ref({ name: user.value.name || '', submitting: false, error: '' });
const emailForm = ref({ email: user.value.email || '', submitting: false, error: '' });
const passwordForm = ref({
    current_password: '',
    password: '',
    password_confirmation: '',
    submitting: false,
    error: '',
});
const timezone = ref(user.value.timezone || 'America/Mexico_City');
const timezoneSubmitting = ref(false);

const timezones = [
    'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago',
    'America/Buenos_Aires', 'America/Caracas', 'America/New_York',
    'America/Chicago', 'America/Los_Angeles', 'Europe/Madrid', 'UTC',
];

function updateName() {
    nameForm.value.submitting = true;
    nameForm.value.error = '';
    router.put('/api/user/profile', { name: nameForm.value.name }, {
        onSuccess: () => nameForm.value.submitting = false,
        onError: (e: any) => {
            nameForm.value.error = e?.name || 'Error al actualizar';
            nameForm.value.submitting = false;
        },
    });
}

function updateEmail() {
    emailForm.value.submitting = true;
    emailForm.value.error = '';
    router.put('/api/user/profile', { email: emailForm.value.email }, {
        onSuccess: () => emailForm.value.submitting = false,
        onError: (e: any) => {
            emailForm.value.error = e?.email || 'Error al actualizar';
            emailForm.value.submitting = false;
        },
    });
}

function updateTimezone() {
    timezoneSubmitting.value = true;
    router.put('/api/user/profile', { timezone: timezone.value }, {
        onSuccess: () => timezoneSubmitting.value = false,
    });
}

function updatePassword() {
    passwordForm.value.submitting = true;
    passwordForm.value.error = '';
    router.put('/api/user/password', {
        current_password: passwordForm.value.current_password,
        password: passwordForm.value.password,
        password_confirmation: passwordForm.value.password_confirmation,
    }, {
        onSuccess: () => {
            passwordForm.value = { current_password: '', password: '', password_confirmation: '', submitting: false, error: '' };
        },
        onError: (e: any) => {
            passwordForm.value.error = e?.message || Object.values(e).flat().join(', ');
            passwordForm.value.submitting = false;
        },
    });
}

function formatDate(dateStr: string | undefined) {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}
</script>

<template>
    <Head title="Mi Perfil - TuiStream" />

    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="max-w-2xl space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tu cuenta y preferencias</p>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-700 gap-1">
                <button
                    v-for="tab in [{ key: 'profile', label: 'Perfil' }, { key: 'security', label: 'Seguridad' }]"
                    :key="tab.key"
                    @click="activeTab = tab.key"
                    :class="[
                        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                        activeTab === tab.key
                            ? 'border-tuistream-500 text-tuistream-600 dark:text-tuistream-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    ]"
                >
                    {{ tab.label }}
                </button>
            </div>

            <!-- Profile Tab -->
            <div v-if="activeTab === 'profile'" class="space-y-4">
                <!-- Avatar + Info -->
                <div class="card flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0">
                        <span class="text-2xl font-bold text-tuistream-600 dark:text-tuistream-400">
                            {{ user.name?.charAt(0)?.toUpperCase() || 'U' }}
                        </span>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ user.name }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Miembro desde {{ formatDate(user.created_at) }}
                        </p>
                    </div>
                </div>

                <!-- Name -->
                <div class="card space-y-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <div class="flex gap-3">
                        <input v-model="nameForm.name" type="text" class="input flex-1" />
                        <button @click="updateName" :disabled="nameForm.submitting" class="btn-primary text-sm">
                            {{ nameForm.submitting ? '...' : 'Guardar' }}
                        </button>
                    </div>
                    <p v-if="nameForm.error" class="text-xs text-red-500">{{ nameForm.error }}</p>
                </div>

                <!-- Email -->
                <div class="card space-y-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <div class="flex gap-3">
                        <input v-model="emailForm.email" type="email" class="input flex-1" />
                        <button @click="updateEmail" :disabled="emailForm.submitting" class="btn-primary text-sm">
                            {{ emailForm.submitting ? '...' : 'Guardar' }}
                        </button>
                    </div>
                    <p v-if="emailForm.error" class="text-xs text-red-500">{{ emailForm.error }}</p>
                </div>

                <!-- Timezone -->
                <div class="card space-y-3">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Zona Horaria</label>
                    <div class="flex gap-3">
                        <select v-model="timezone" class="input flex-1">
                            <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
                        </select>
                        <button @click="updateTimezone" :disabled="timezoneSubmitting" class="btn-primary text-sm">
                            {{ timezoneSubmitting ? '...' : 'Guardar' }}
                        </button>
                    </div>
                </div>

                <!-- Session Info -->
                <div class="card space-y-3">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Información de Sesión</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <p class="text-gray-400 dark:text-gray-500">Último acceso</p>
                            <p class="text-gray-900 dark:text-white">{{ formatDate(user.last_login_at) }}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 dark:text-gray-500">IP último acceso</p>
                            <p class="text-gray-900 dark:text-white font-mono text-xs">{{ user.last_login_ip || '—' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Tab -->
            <div v-if="activeTab === 'security'" class="space-y-4">
                <!-- Change Password -->
                <div class="card space-y-4">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Cambiar Contraseña</h4>
                    <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Contraseña actual</label>
                        <input v-model="passwordForm.current_password" type="password" class="input w-full" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nueva contraseña</label>
                        <input v-model="passwordForm.password" type="password" class="input w-full" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Confirmar nueva contraseña</label>
                        <input v-model="passwordForm.password_confirmation" type="password" class="input w-full" />
                    </div>
                    <p v-if="passwordForm.error" class="text-xs text-red-500">{{ passwordForm.error }}</p>
                    <button
                        @click="updatePassword"
                        :disabled="passwordForm.submitting || !passwordForm.current_password || !passwordForm.password"
                        class="btn-primary text-sm"
                    >
                        {{ passwordForm.submitting ? 'Actualizando...' : 'Actualizar Contraseña' }}
                    </button>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
