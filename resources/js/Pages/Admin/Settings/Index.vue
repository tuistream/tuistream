<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';
import { useLogo } from '@/Composables/useLogo';

const { setLogoUrls } = useLogo();

interface SettingItem {
    id: number;
    key: string;
    value: string | null;
    type: string;
    group: string;
    label: string | null;
}

const settingsByGroup = ref<Record<string, SettingItem[]>>({});
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);
const error = ref('');
const activeTab = ref('general');
const editedValues = ref<Record<string, string>>({});

const groups = [
    { key: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'streaming', label: 'Streaming', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
    { key: 'players', label: 'Players', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { key: 'vod', label: 'VOD', icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
    { key: 'autodj', label: 'AutoDJ', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
    { key: 'media_services', label: 'Servicios', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
    { key: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'notifications', label: 'Notificaciones', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'security', label: 'Seguridad', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

const currentSettings = ref<SettingItem[]>([]);

function getValue(item: SettingItem): string {
    return editedValues.value[item.key] ?? item.value ?? '';
}

function setValue(item: SettingItem, val: string) {
    editedValues.value[item.key] = val;
}

function isEdited(item: SettingItem): boolean {
    return editedValues.value[item.key] !== undefined && editedValues.value[item.key] !== (item.value ?? '');
}

function hasChanges(): boolean {
    return currentSettings.value.some(s => isEdited(s));
}

// Image upload for logo/favicon
const uploadingImage = ref<string | null>(null);

async function uploadImage(key: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', key);

    uploadingImage.value = key;
    error.value = '';
    try {
        const { data } = await axios.post('/api/settings/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Update the displayed value and mark as edited
        editedValues.value[key] = data.url;
        // Auto-save immediately for images
        await saveSettings();
        // Update the underlying setting
        const item = currentSettings.value.find(s => s.key === key);
        if (item) item.value = data.url;

        // Update localStorage so sidebar/login logos refresh immediately
        if (key === 'app_logo_url') {
            setLogoUrls(data.url);
        }
        // Note: favicon is updated reactively via the useLogo composable's watchEffect
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al subir la imagen';
    } finally {
        uploadingImage.value = null;
    }
}

async function fetchSettings() {
    loading.value = true;
    error.value = '';
    try {
        const { data } = await axios.get('/api/settings');
        settingsByGroup.value = data;
        if (data[activeTab.value]) {
            currentSettings.value = data[activeTab.value];
        }
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al cargar la configuración';
    } finally {
        loading.value = false;
    }
}

function switchTab(tab: string) {
    activeTab.value = tab;
    editedValues.value = {};
    saved.value = false;
    if (settingsByGroup.value[tab]) {
        currentSettings.value = settingsByGroup.value[tab];
    }
}

async function saveSettings() {
    const changes = currentSettings.value
        .filter(s => isEdited(s))
        .map(s => ({ key: s.key, value: editedValues.value[s.key] }));

    if (!changes.length) return;

    saving.value = true;
    saved.value = false;
    error.value = '';
    try {
        await axios.put('/api/settings', { settings: changes });
        changes.forEach(c => {
            const item = currentSettings.value.find(s => s.key === c.key);
            if (item) item.value = c.value;
        });
        editedValues.value = {};
        saved.value = true;
        setTimeout(() => saved.value = false, 3000);
    } catch (e: any) {
        error.value = e.response?.data?.message || 'Error al guardar la configuración';
    } finally {
        saving.value = false;
    }
}

onMounted(fetchSettings);
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Administra los parámetros del sistema</p>
                </div>
                <button
                    @click="saveSettings"
                    :disabled="saving || !hasChanges()"
                    class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg v-if="saving" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <svg v-else-if="saved" class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {{ saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios' }}
                </button>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit overflow-x-auto">
                <button
                    v-for="group in groups"
                    :key="group.key"
                    @click="switchTab(group.key)"
                    :class="[
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                        activeTab === group.key
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    ]"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="group.icon" />
                    </svg>
                    {{ group.label }}
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

            <!-- Settings Form -->
            <div v-else class="card space-y-5">
                <div v-if="!currentSettings.length" class="text-center py-12 text-gray-400">
                    No hay configuraciones en esta sección
                </div>

                <div
                    v-for="setting in currentSettings"
                    :key="setting.id"
                    :class="['p-4 rounded-xl transition-colors', isEdited(setting) ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800/50']"
                >
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <label :for="setting.key" class="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-56 flex-shrink-0">
                            {{ setting.label || setting.key }}
                            <span v-if="isEdited(setting)" class="text-yellow-600 dark:text-yellow-400 text-xs ml-1">(modificado)</span>
                        </label>

                        <!-- Boolean -->
                        <div v-if="setting.type === 'boolean'" class="flex-1 flex items-center gap-3">
                            <button
                                type="button"
                                @click="setValue(setting, getValue(setting) === 'true' ? 'false' : 'true')"
                                :class="[
                                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                                    getValue(setting) === 'true' ? 'bg-tuistream-600' : 'bg-gray-300 dark:bg-gray-600'
                                ]"
                            >
                                <span
                                    :class="[
                                        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                                        getValue(setting) === 'true' ? 'translate-x-5' : ''
                                    ]"
                                />
                            </button>
                            <span class="text-sm text-gray-500 dark:text-gray-400">{{ getValue(setting) === 'true' ? 'Habilitado' : 'Deshabilitado' }}</span>
                        </div>

                        <!-- Integer -->
                        <div v-else-if="setting.type === 'integer'" class="flex-1">
                            <input
                                :id="setting.key"
                                type="number"
                                :value="getValue(setting)"
                                @input="setValue(setting, ($event.target as HTMLInputElement).value)"
                                class="w-full sm:w-48 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <!-- String (default) -->
                        <div v-else class="flex-1">
                            <!-- Image upload for logo/favicon -->
                            <div v-if="['app_logo_url', 'app_favicon_url'].includes(setting.key)" class="flex items-center gap-4">
                                <div class="relative">
                                    <img
                                        v-if="getValue(setting)"
                                        :src="getValue(setting)"
                                        :alt="setting.label"
                                        class="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                                    />
                                    <div v-else class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div v-if="uploadingImage === setting.key" class="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                        <svg class="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                    </div>
                                </div>
                                <label class="px-3 py-1.5 text-xs font-medium rounded-lg bg-tuistream-50 dark:bg-tuistream-900/30 text-tuistream-700 dark:text-tuistream-300 cursor-pointer hover:bg-tuistream-100 dark:hover:bg-tuistream-900/50 transition-colors">
                                    {{ setting.key === 'app_logo_url' ? 'Subir Logo' : 'Subir Favicon' }}
                                    <input type="file" accept="image/*" class="hidden" @change="uploadImage(setting.key, $event)" />
                                </label>
                            </div>
                            <input
                                v-else
                                :id="setting.key"
                                type="text"
                                :value="getValue(setting)"
                                @input="setValue(setting, ($event.target as HTMLInputElement).value)"
                                class="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1 sm:ml-56">{{ setting.key }}</p>
                </div>
            </div>

            <!-- System Info -->
            <div class="card">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Información del Sistema</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p class="text-xs text-gray-400">Versión de TuiStream</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">v1.0.0</p>
                    </div>
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p class="text-xs text-gray-400">Laravel</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">13.14.0</p>
                    </div>
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p class="text-xs text-gray-400">PHP</p>
                        <p class="text-sm font-semibold text-gray-900 dark:text-white">8.4</p>
                    </div>
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p class="text-xs text-gray-400">Entorno</p>
                        <p class="text-sm font-semibold text-green-600">local</p>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
