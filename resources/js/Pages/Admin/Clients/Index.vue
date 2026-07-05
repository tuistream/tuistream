<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePage, Link, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

const page = usePage();
const clients = computed(() => page.props.clients?.data || []);
const pagination = computed(() => page.props.clients || {});

const search = ref('');
const statusFilter = ref('');
const impersonating = ref<number | null>(null);
const error = ref('');

function filteredClients() {
    let result = clients.value;
    if (search.value) {
        const q = search.value.toLowerCase();
        result = result.filter((c: any) =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
    }
    if (statusFilter.value) {
        result = result.filter((c: any) => c.status === statusFilter.value);
    }
    return result;
}

function impersonate(clientId: number) {
    impersonating.value = clientId;
    error.value = '';
    router.post(`/admin/impersonate/${clientId}`, {}, {
        onError: (e: any) => {
            error.value = e?.message || 'Error al impersonar cliente';
        },
        onFinish: () => {
            impersonating.value = null;
        }
    });
}
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las cuentas de clientes</p>
                </div>
                <Link href="/admin/clients/create" class="btn-primary inline-flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Cliente
                </Link>
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
                <button @click="error = ''" class="ml-auto p-1 text-red-400 hover:text-red-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Filters -->
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input v-model="search" type="text" placeholder="Buscar por nombre o email..." class="input-field pl-9" />
                </div>
                <select v-model="statusFilter" class="select-field sm:w-48">
                    <option value="">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                </select>
            </div>

            <!-- Table -->
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th class="hidden sm:table-cell">Email</th>
                            <th class="hidden md:table-cell">Plan</th>
                            <th class="hidden lg:table-cell">Emisoras</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="client in filteredClients()" :key="client.id">
                            <td>
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-xl bg-tuistream-100 dark:bg-tuistream-900/40 flex items-center justify-center flex-shrink-0">
                                        <span class="text-tuistream-600 dark:text-tuistream-400 font-semibold text-sm">{{ client.name?.charAt(0)?.toUpperCase() }}</span>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ client.name }}</p>
                                        <p class="text-xs text-gray-400 sm:hidden">{{ client.email }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="hidden sm:table-cell">
                                <span class="text-sm text-gray-600 dark:text-gray-400">{{ client.email }}</span>
                            </td>
                            <td class="hidden md:table-cell">
                                <span class="badge badge-info capitalize">{{ client.plan || 'Free' }}</span>
                            </td>
                            <td class="hidden lg:table-cell">
                                <span class="text-sm text-gray-600 dark:text-gray-400">{{ client.stations_count || 0 }}</span>
                            </td>
                            <td>
                                <span :class="client.status === 'active' ? 'badge-success' : client.status === 'suspended' ? 'badge-error' : 'badge-warning'" class="badge capitalize">
                                    {{ client.status || 'active' }}
                                </span>
                            </td>
                            <td>
                                <div class="flex items-center gap-1">
                                    <Link :href="`/admin/clients/${client.id}`" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Ver">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </Link>
                                    <button
                                        @click="impersonate(client.id)"
                                        :disabled="impersonating === client.id"
                                        class="p-2 rounded-lg hover:bg-tuistream-50 dark:hover:bg-tuistream-900/20 text-gray-400 hover:text-tuistream-600 dark:hover:text-tuistream-400 transition-colors disabled:opacity-50"
                                        title="Impersonar"
                                    >
                                        <svg v-if="impersonating === client.id" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="!filteredClients().length" class="text-center py-12 text-gray-400 text-sm">
                    No se encontraron clientes
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.last_page > 1" class="flex items-center justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">
                    Mostrando {{ pagination.from || 0 }} - {{ pagination.to || 0 }} de {{ pagination.total || 0 }}
                </span>
                <div class="flex items-center gap-1">
                    <Link
                        v-if="pagination.prev_page_url"
                        :href="pagination.prev_page_url"
                        class="btn-secondary px-3 py-2 text-xs"
                    >
                        Anterior
                    </Link>
                    <Link
                        v-if="pagination.next_page_url"
                        :href="pagination.next_page_url"
                        class="btn-secondary px-3 py-2 text-xs"
                    >
                        Siguiente
                    </Link>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
