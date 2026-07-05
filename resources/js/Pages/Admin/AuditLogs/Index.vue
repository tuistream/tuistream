<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface AuditLog {
    id: number;
    user_id: number;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
}

interface PaginatedResponse {
    data: AuditLog[];
    current_page: number;
    last_page: number;
    total: number;
}

const logs = ref<AuditLog[]>([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const actionFilter = ref('');
const pagination = ref({ current: 1, last: 1, total: 0 });

const actionLabels: Record<string, { label: string; color: string }> = {
    login: { label: 'Inicio de sesión', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    logout: { label: 'Cierre de sesión', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
    create: { label: 'Creación', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    update: { label: 'Actualización', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    delete: { label: 'Eliminación', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    suspend: { label: 'Suspensión', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    unsuspend: { label: 'Reactivación', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

const entityLabels: Record<string, string> = {
    'App\\Models\\Station': 'Emisora',
    'App\\Models\\TvChannel': 'Canal TV',
    'App\\Models\\User': 'Usuario',
    'App\\Models\\Media': 'Archivo',
    'App\\Models\\Playlist': 'Playlist',
};

const uniqueActions = computed(() => {
    const set = new Set(logs.value.map(l => l.action));
    return Array.from(set);
});

const filteredLogs = computed(() => {
    let result = logs.value;
    if (search.value) {
        const q = search.value.toLowerCase();
        result = result.filter(l =>
            l.user?.name?.toLowerCase().includes(q) ||
            l.user?.email?.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            l.entity_type?.toLowerCase().includes(q) ||
            l.ip_address?.includes(q)
        );
    }
    if (actionFilter.value) {
        result = result.filter(l => l.action === actionFilter.value);
    }
    return result;
});

async function fetchLogs(page = 1) {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get(`/api/audit-logs?page=${page}`);
        logs.value = data.data || data;
        if (data.current_page) {
            pagination.value = { current: data.current_page, last: data.last_page, total: data.total };
        }
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar los registros de auditoría';
    } finally {
        loading.value = false;
    }
}

function actionBadge(action: string) {
    return actionLabels[action] || { label: action, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
}

function entityName(log: AuditLog): string {
    if (!log.entity_type) return '—';
    const short = entityLabels[log.entity_type] || log.entity_type.split('\\').pop() || log.entity_type;
    return log.entity_id ? `${short} #${log.entity_id}` : short;
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'medium' });
}

function diffValues(log: AuditLog): string {
    if (!log.old_values && !log.new_values) return '';
    const changes: string[] = [];
    const old = log.old_values || {};
    const nw = log.new_values || {};

    for (const key of new Set([...Object.keys(old), ...Object.keys(nw)])) {
        if (key === 'password' || key === 'updated_at' || key === 'created_at') continue;
        const ov = old[key] !== undefined ? JSON.stringify(old[key]) : '—';
        const nv = nw[key] !== undefined ? JSON.stringify(nw[key]) : '—';
        if (ov !== nv) {
            changes.push(`${key}: ${ov} → ${nv}`);
        }
    }
    return changes.join('; ');
}

onMounted(() => fetchLogs());
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Header -->
            <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Registros de Auditoría</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Historial de acciones en el sistema</p>
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
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Buscar por usuario, acción, entidad o IP..."
                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                    />
                </div>
                <select
                    v-model="actionFilter"
                    class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                >
                    <option value="">Todas las acciones</option>
                    <option v-for="act in uniqueActions" :key="act" :value="act">{{ actionBadge(act).label }}</option>
                </select>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>

            <!-- Table -->
            <div v-else class="card overflow-hidden !p-0">
                <div v-if="!filteredLogs.length" class="flex flex-col items-center justify-center py-16 text-center">
                    <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p class="text-lg font-medium text-gray-400 dark:text-gray-500">Sin registros</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">No hay actividad registrada aún</p>
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-100 dark:border-gray-800">
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Fecha</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Usuario</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Acción</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden lg:table-cell">Entidad</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden xl:table-cell">Cambios</th>
                                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider hidden md:table-cell">IP</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                            <tr
                                v-for="log in filteredLogs"
                                :key="log.id"
                                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                                <td class="py-3 px-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
                                            <span class="text-purple-600 dark:text-purple-400 font-semibold text-xs">{{ log.user?.name?.charAt(0)?.toUpperCase() }}</span>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ log.user?.name || 'Sistema' }}</p>
                                            <p class="text-xs text-gray-400 truncate">{{ log.user?.email || '' }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3 px-4">
                                    <span :class="actionBadge(log.action).color" class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                        {{ actionBadge(log.action).label }}
                                    </span>
                                </td>
                                <td class="py-3 px-4 hidden lg:table-cell">
                                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ entityName(log) }}</span>
                                </td>
                                <td class="py-3 px-4 hidden xl:table-cell max-w-xs">
                                    <span class="text-xs text-gray-400 truncate block max-w-[250px]" :title="diffValues(log)">{{ diffValues(log) || '—' }}</span>
                                </td>
                                <td class="py-3 px-4 hidden md:table-cell">
                                    <code class="text-xs text-gray-400">{{ log.ip_address || '—' }}</code>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.last > 1" class="flex items-center justify-between text-sm">
                <span class="text-gray-400">{{ pagination.total }} registros</span>
                <div class="flex gap-1">
                    <button :disabled="pagination.current <= 1" @click="fetchLogs(pagination.current - 1)" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all">Anterior</button>
                    <button :disabled="pagination.current >= pagination.last" @click="fetchLogs(pagination.current + 1)" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all">Siguiente</button>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
