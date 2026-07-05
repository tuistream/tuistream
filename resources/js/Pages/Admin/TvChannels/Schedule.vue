<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface VideoSchedule {
    id: number;
    tv_channel_id: number;
    media_id: number | null;
    title: string;
    start_time: string;
    end_time: string;
    days_of_week: number[] | null;
    repeat_until: string | null;
    priority: number;
    is_active: boolean;
    media?: { id: number; original_name: string } | null;
}

interface TvChannel {
    id: number;
    name: string;
    channel_type: string;
    client: { id: number; name: string } | null;
}

const page = usePage();
const channelId = computed(() => {
    const path = page.url;
    const match = path.match(/\/admin\/tv-channels\/(\d+)\/schedule/);
    return match ? parseInt(match[1]) : 0;
});

const channel = ref<TvChannel | null>(null);
const schedules = ref<VideoSchedule[]>([]);
const loading = ref(true);
const error = ref('');
// Modal state
const showModal = ref(false);
const editingSchedule = ref<VideoSchedule | null>(null);
const form = ref({
    title: '',
    media_id: null as number | null,
    start_time: '',
    end_time: '',
    days_of_week: [] as number[],
    repeat_until: '',
    priority: 1,
    is_active: true,
});
const formError = ref('');
const submitting = ref(false);

// Day labels
const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
}

function daysLabel(days: number[] | null) {
    if (!days || !days.length) return '—';
    if (days.length === 7) return 'Todos los días';
    return days.map(d => dayLabels[d]).join(', ');
}

function channelTypeLabel(type: string) {
    const map: Record<string, string> = { tv_247: 'TV 24/7', web_tv: 'Web TV', visual_radio: 'Radio Visual', live_event: 'Evento en Vivo' };
    return map[type] || type;
}

// Group schedules by day for the grid view
const gridDays = computed(() => {
    const days: { label: string; index: number; items: VideoSchedule[] }[] = [];
    for (let i = 0; i < 7; i++) {
        const items = schedules.value
            .filter(s => s.is_active && (!s.days_of_week || s.days_of_week.includes(i)))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        days.push({ label: dayLabels[i], index: i, items });
    }
    return days;
});

async function fetchData() {
    loading.value = true;
    error.value = '';
    try {
        const channelRes = await axios.get(`/api/tv-channels/${channelId.value}`);
        channel.value = channelRes.data;
        schedules.value = channelRes.data.schedules || [];
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar la programación';
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editingSchedule.value = null;
    formError.value = '';
    form.value = {
        title: '',
        media_id: null,
        start_time: '',
        end_time: '',
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        repeat_until: '',
        priority: 1,
        is_active: true,
    };
    showModal.value = true;
}

function openEdit(schedule: VideoSchedule) {
    editingSchedule.value = schedule;
    formError.value = '';
    form.value = {
        title: schedule.title,
        media_id: schedule.media_id,
        start_time: schedule.start_time.slice(0, 16),
        end_time: schedule.end_time.slice(0, 16),
        days_of_week: schedule.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        repeat_until: schedule.repeat_until ? schedule.repeat_until.slice(0, 10) : '',
        priority: schedule.priority,
        is_active: schedule.is_active,
    };
    showModal.value = true;
}

function toggleDay(day: number) {
    const idx = form.value.days_of_week.indexOf(day);
    if (idx >= 0) {
        form.value.days_of_week.splice(idx, 1);
    } else {
        form.value.days_of_week.push(day);
    }
}

async function submitForm() {
    if (!form.value.title || !form.value.start_time || !form.value.end_time) {
        formError.value = 'Completa los campos obligatorios (título, inicio y fin)';
        return;
    }
    if (new Date(form.value.end_time) <= new Date(form.value.start_time)) {
        formError.value = 'La hora de fin debe ser posterior a la de inicio';
        return;
    }

    submitting.value = true;
    formError.value = '';
    try {
        if (editingSchedule.value) {
            await axios.put(`/api/tv-channels/${channelId.value}/schedules/${editingSchedule.value.id}`, form.value);
        } else {
            await axios.post(`/api/tv-channels/${channelId.value}/schedules`, form.value);
        }
        showModal.value = false;
        await fetchData();
    } catch (e: any) {
        formError.value = e.response?.data?.message || 'Error al guardar la programación';
    } finally {
        submitting.value = false;
    }
}

async function deleteSchedule(schedule: VideoSchedule) {
    if (!confirm(`¿Eliminar "${schedule.title}"? Esta acción no se puede deshacer.`)) return;
    try {
        await axios.delete(`/api/tv-channels/${channelId.value}/schedules/${schedule.id}`);
        await fetchData();
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al eliminar el programa';
    }
}

async function toggleActive(schedule: VideoSchedule) {
    try {
        await axios.put(`/api/tv-channels/${channelId.value}/schedules/${schedule.id}`, {
            is_active: !schedule.is_active,
        });
        await fetchData();
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cambiar estado';
    }
}

onMounted(fetchData);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav>
            <SidebarNav />
        </template>

        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <Link href="/admin/tv-channels" class="text-sm text-gray-400 hover:text-tuistream-600 transition-colors flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Canales TV
                        </Link>
                        <span class="text-gray-300 dark:text-gray-600">/</span>
                        <span class="text-sm text-gray-500">{{ channel?.name || 'Cargando...' }}</span>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Programación EPG</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ channel ? `${channelTypeLabel(channel.channel_type)} · Parrilla de programación 24/7` : '' }}
                    </p>
                </div>
                <button
                    @click="openCreate"
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Programa
                </button>
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

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>

            <!-- Programming Grid -->
            <div v-else class="space-y-4">
                <!-- Day Grid -->
                <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div v-for="day in gridDays" :key="day.index" class="card !p-3 space-y-2">
                        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center pb-2 border-b border-gray-100 dark:border-gray-800">
                            {{ day.label }}
                        </h4>
                        <div v-if="!day.items.length" class="text-center py-4 text-xs text-gray-400">
                            Sin programación
                        </div>
                        <div
                            v-for="schedule in day.items"
                            :key="schedule.id"
                            class="p-2 rounded-lg text-xs space-y-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            @click="openEdit(schedule)"
                        >
                            <div class="flex items-center justify-between gap-1">
                                <span class="font-medium text-gray-900 dark:text-white truncate">{{ schedule.title }}</span>
                                <span
                                    :class="schedule.is_active ? 'bg-green-500' : 'bg-gray-400'"
                                    class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                />
                            </div>
                            <p class="text-gray-400">
                                {{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}
                            </p>
                            <p v-if="schedule.media" class="text-tuistream-500 truncate">
                                {{ schedule.media.original_name }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Schedule List -->
                <div class="card overflow-hidden !p-0">
                    <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Lista de Programas ({{ schedules.length }})</h3>
                    </div>
                    <div v-if="!schedules.length" class="flex flex-col items-center justify-center py-12 text-center px-4">
                        <svg class="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm font-medium text-gray-400 dark:text-gray-500">Sin programas</p>
                        <p class="text-xs text-gray-400 mt-1">Agrega programas para construir la parrilla 24/7</p>
                    </div>
                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-100 dark:border-gray-800">
                                    <th class="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Programa</th>
                                    <th class="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Horario</th>
                                    <th class="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase hidden md:table-cell">Días</th>
                                    <th class="text-center py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Activo</th>
                                    <th class="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                <tr v-for="schedule in schedules" :key="schedule.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td class="py-2.5 px-4">
                                        <p class="font-medium text-gray-900 dark:text-white text-xs">{{ schedule.title }}</p>
                                        <p v-if="schedule.media" class="text-xs text-gray-400 truncate">{{ schedule.media.original_name }}</p>
                                    </td>
                                    <td class="py-2.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                                        {{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}
                                    </td>
                                    <td class="py-2.5 px-4 hidden md:table-cell">
                                        <span class="text-xs text-gray-500">{{ daysLabel(schedule.days_of_week) }}</span>
                                    </td>
                                    <td class="py-2.5 px-4 text-center">
                                        <button
                                            @click="toggleActive(schedule)"
                                            :class="[
                                                'w-8 h-5 rounded-full transition-colors relative',
                                                schedule.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                            ]"
                                        >
                                            <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', schedule.is_active ? 'translate-x-3.5' : 'translate-x-0.5']" />
                                        </button>
                                    </td>
                                    <td class="py-2.5 px-4 text-right">
                                        <div class="flex items-center justify-end gap-1">
                                            <button @click="openEdit(schedule)" class="p-1.5 rounded-lg text-gray-400 hover:text-tuistream-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Editar">
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button @click="deleteSchedule(schedule)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="showModal = false">
                <div class="fixed inset-0 bg-black/50" />
                <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="p-6 space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                {{ editingSchedule ? 'Editar Programa' : 'Nuevo Programa' }}
                            </h3>
                            <button @click="showModal = false" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                            {{ formError }}
                        </div>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del programa *</label>
                                <input v-model="form.title" type="text" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent" placeholder="Ej: Noticiero Matutino" />
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora inicio *</label>
                                    <input v-model="form.start_time" type="datetime-local" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora fin *</label>
                                    <input v-model="form.end_time" type="datetime-local" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent" />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días de la semana</label>
                                <div class="flex gap-1.5">
                                    <button
                                        v-for="(label, idx) in dayLabels"
                                        :key="idx"
                                        @click="toggleDay(idx)"
                                        :class="[
                                            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                                            form.days_of_week.includes(idx)
                                                ? 'bg-tuistream-600 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        ]"
                                    >
                                        {{ label }}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repetir hasta (opcional)</label>
                                <input v-model="form.repeat_until" type="date" class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                                <input v-model.number="form.priority" type="number" min="1" max="100" class="w-32 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent" />
                            </div>

                            <div class="flex items-center gap-2">
                                <button
                                    @click="form.is_active = !form.is_active"
                                    :class="['w-10 h-5 rounded-full transition-colors relative', form.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600']"
                                >
                                    <span :class="['absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', form.is_active ? 'translate-x-5' : 'translate-x-0.5']" />
                                </button>
                                <span class="text-sm text-gray-700 dark:text-gray-300">{{ form.is_active ? 'Activo' : 'Inactivo' }}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 pt-2">
                            <button @click="showModal = false" class="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                Cancelar
                            </button>
                            <button
                                @click="submitForm"
                                :disabled="submitting"
                                class="flex-1 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg v-if="submitting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {{ submitting ? 'Guardando...' : editingSchedule ? 'Actualizar' : 'Crear Programa' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </AuthenticatedLayout>
</template>
