<script setup lang="ts">
import { ref } from 'vue';
import { useForm, Link } from '@inertiajs/vue3';
import GuestLayout from '@/Layouts/GuestLayout.vue';

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const showPassword = ref(false);
const loginError = ref('');

function submit() {
    loginError.value = '';

    form.post('/login', {
        preserveScroll: true,
        onError: (errors) => {
            loginError.value = errors.email || 'Error al iniciar sesión. Verifica tus credenciales.';
        },
        onFinish: () => {
            form.reset('password');
        },
    });
}
</script>

<template>
    <GuestLayout>
        <div class="p-6 sm:p-8">
            <!-- Header -->
            <div class="text-center mb-8">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Accede al panel de administración de TuiStream</p>
            </div>

            <!-- Error Alert -->
            <div v-if="loginError" class="alert alert-error mb-4">
                <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ loginError }}
            </div>

            <!-- Form -->
            <form @submit.prevent="submit" class="space-y-4">
                <div>
                    <label for="email" class="label">Correo electrónico</label>
                    <input
                        id="email"
                        v-model="form.email"
                        type="email"
                        class="input-field"
                        placeholder="info@hostuis.com"
                        required
                        autocomplete="email"
                        autofocus
                    />
                </div>

                <div>
                    <label for="password" class="label mb-1.5">Contraseña</label>
                    <div class="relative">
                        <input
                            id="password"
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            class="input-field pr-12"
                            placeholder="••••••••"
                            required
                            autocomplete="current-password"
                        />
                        <button
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                        >
                            <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <label class="relative inline-flex items-center cursor-pointer select-none">
                        <input v-model="form.remember" type="checkbox" class="sr-only peer" />
                        <div class="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:ring-2 peer-focus:ring-tuistream-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-tuistream-600 transition-colors"></div>
                        <span class="ms-2 text-xs text-gray-600 dark:text-gray-400">Recordarme</span>
                    </label>
                </div>

                <button
                    type="submit"
                    :disabled="form.processing"
                    class="btn-primary w-full justify-center mt-2"
                >
                    <svg v-if="form.processing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ form.processing ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
                </button>
            </form>

            <!-- Footer -->
            <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                    <svg class="w-3.5 h-3.5 inline-block mr-1 text-tuistream-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Solo el administrador del sistema puede crear nuevas cuentas de usuario.
                </p>
            </div>
        </div>
    </GuestLayout>
</template>
