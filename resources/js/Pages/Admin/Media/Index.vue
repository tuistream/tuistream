<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface MediaFile {
    id: number;
    filename: string;
    original_name: string;
    path: string;
    type: 'audio' | 'video';
    format: string;
    size: number;
    duration: number | null;
    bitrate: number | null;
    sample_rate: number | null;
    channels: number | null;
    resolution: string | null;
    codec: string | null;
    folder_id: number | null;
    client_id: number;
    created_at: string;
    folder: { id: number; name: string } | null;
}

interface MediaFolder {
    id: number;
    name: string;
    parent_id: number | null;
}

interface PaginatedResponse {
    data: MediaFile[];
    current_page: number;
    last_page: number;
    total: number;
}

const media = ref<MediaFile[]>([]);
const folders = ref<MediaFolder[]>([]);
const loading = ref(true);
const search = ref('');
const typeFilter = ref('');
const currentFolder = ref<number | null>(null);
const deleting = ref<number | null>(null);
const pagination = ref({ current: 1, last: 1, total: 0 });

// Upload state
const showUpload = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');

// New folder state
const showNewFolder = ref(false);
const newFolderName = ref('');
const creatingFolder = ref(false);
const folderError = ref('');
const dragging = ref(false);

async function fetchMedia(page = 1) {
    loading.value = true;
    try {
        const params: any = { page };
        if (currentFolder.value) params.folder_id = currentFolder.value;
        if (typeFilter.value) params.type = typeFilter.value;
        if (search.value) params.search = search.value;

        const { data } = await axios.get('/api/media', { params });
        media.value = data.media.data || data.media;
        folders.value = data.folders || [];
        if (data.media.current_page) {
            pagination.value = { current: data.media.current_page, last: data.media.last_page, total: data.media.total };
        }
    } catch (e) {
        console.error('Error fetching media:', e);
    } finally {
        loading.value = false;
    }
}

async function deleteMedia(file: MediaFile) {
    if (!confirm(`¿Eliminar "${file.original_name}"?`)) return;
    deleting.value = file.id;
    try {
        await axios.delete(`/api/media/${file.id}`);
        media.value = media.value.filter(m => m.id !== file.id);
    } catch (e) {
        alert('Error al eliminar');
    } finally {
        deleting.value = null;
    }
}

function navigateToFolder(id: number | null) {
    currentFolder.value = id;
    fetchMedia();
}

function goToParent() {
    if (currentFolder.value) {
        const parent = folders.value.find(f => f.id === currentFolder.value);
        navigateToFolder(parent?.parent_id ?? null);
        return;
    }
    navigateToFolder(null);
}

async function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    const formData = new FormData();
    for (const file of Array.from(input.files)) {
        formData.append('files[]', file);
    }
    if (currentFolder.value) formData.append('folder_id', String(currentFolder.value));

    uploading.value = true;
    uploadError.value = '';
    uploadProgress.value = 0;

    try {
        await axios.post('/api/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
                if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total);
            },
        });
        input.value = '';
        showUpload.value = false;
        await fetchMedia();
    } catch (e: any) {
        uploadError.value = e.response?.data?.message || 'Error al subir archivos';
    } finally {
        uploading.value = false;
    }
}

async function createFolder() {
    if (!newFolderName.value.trim()) { folderError.value = 'Nombre requerido'; return; }
    creatingFolder.value = true;
    folderError.value = '';
    try {
        await axios.post('/api/media/folders', {
            name: newFolderName.value,
            parent_id: currentFolder.value,
        });
        newFolderName.value = '';
        showNewFolder.value = false;
        await fetchMedia();
    } catch (e: any) {
        folderError.value = e.response?.data?.message || 'Error al crear carpeta';
    } finally {
        creatingFolder.value = false;
    }
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(sec: number | null) {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function typeIcon(type: string) {
    return type === 'video' ? 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' : 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z';
}

function getFileUrl(file: MediaFile) {
    return `/storage/${file.path}`;
}

function isImagePreview(format: string) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format?.toLowerCase());
}

const typeLabels: Record<string, string> = { audio: 'Audio', video: 'Video' };
const typeColors: Record<string, string> = { audio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', video: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };

function onDrop(e: DragEvent) {
    dragging.value = false;
    if (!e.dataTransfer?.files.length) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    const dt = e.dataTransfer;
    Object.defineProperty(input, 'files', { value: dt.files });
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { writable: false, value: input });
    handleFileUpload(event as unknown as Event);
}

watch([search, typeFilter], () => fetchMedia());
onMounted(() => fetchMedia());
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
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Biblioteca Multimedia</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona archivos de audio y video</p>
                </div>
                <div class="flex gap-2">
                    <button
                        @click="showNewFolder = true"
                        class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm rounded-xl transition-all"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Nueva Carpeta
                    </button>
                    <button
                        @click="showUpload = true"
                        class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Subir Archivos
                    </button>
                </div>
            </div>

            <!-- Toolbar: Search + Filters -->
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Buscar archivos..."
                        class="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                    />
                </div>
                <select
                    v-model="typeFilter"
                    class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                >
                    <option value="">Todos los tipos</option>
                    <option value="audio">🎵 Audio</option>
                    <option value="video">🎬 Video</option>
                </select>
            </div>

            <!-- Breadcrumb + Folder Nav -->
            <div class="flex items-center gap-2 text-sm">
                <button
                    @click="navigateToFolder(null)"
                    :class="!currentFolder ? 'text-tuistream-600 dark:text-tuistream-400 font-medium' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                    class="transition-colors"
                >
                    📁 Biblioteca
                </button>
                <template v-if="currentFolder">
                    <span class="text-gray-300 dark:text-gray-600">/</span>
                    <button @click="goToParent" class="text-tuistream-600 dark:text-tuistream-400 font-medium transition-colors">
                        {{ folders.find(f => f.id === currentFolder)?.name || '...' }}
                    </button>
                </template>
            </div>

            <!-- Folders Grid -->
            <div v-if="folders.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <button
                    v-for="folder in folders"
                    :key="folder.id"
                    @click="navigateToFolder(folder.id)"
                    class="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 hover:shadow-sm transition-all text-center group"
                >
                    <svg class="w-10 h-10 text-yellow-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-15a3 3 0 00-3 3V18a3 3 0 003 3h15zM1.5 10.146V6a3 3 0 013-3h5.379a2.25 2.25 0 011.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 013 3v1.146A4.483 4.483 0 0019.5 9h-15a4.483 4.483 0 00-3 1.146z" />
                    </svg>
                    <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{{ folder.name }}</p>
                </button>
            </div>

            <!-- Upload Modal -->
            <div v-if="showUpload" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showUpload = false">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Subir Archivos</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Arrastra archivos o haz clic para seleccionar (máx. 512 MB)</p>

                        <label
                            :class="['flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all', dragging ? 'border-tuistream-500 bg-tuistream-50 dark:bg-tuistream-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-tuistream-400']"
                            @dragover.prevent="dragging = true"
                            @dragleave.prevent="dragging = false"
                            @drop.prevent="onDrop"
                        >
                            <svg class="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span class="text-sm text-gray-500 dark:text-gray-400">Suelta archivos aquí o haz clic</span>
                            <input type="file" multiple accept="audio/*,video/*" class="hidden" @change="handleFileUpload" />
                        </label>

                        <!-- Progress -->
                        <div v-if="uploading" class="mt-4 space-y-2">
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="bg-tuistream-500 h-2 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }" />
                            </div>
                            <p class="text-xs text-gray-400 text-center">{{ uploadProgress }}%</p>
                        </div>

                        <div v-if="uploadError" class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-400">{{ uploadError }}</div>

                        <div class="flex justify-end gap-3 mt-6">
                            <button @click="showUpload = false" :disabled="uploading" class="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- New Folder Modal -->
            <div v-if="showNewFolder" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showNewFolder = false">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Nueva Carpeta</h3>
                        <input
                            v-model="newFolderName"
                            type="text"
                            placeholder="Nombre de la carpeta"
                            class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"
                            @keyup.enter="createFolder"
                        />
                        <div v-if="folderError" class="mt-2 text-sm text-red-500">{{ folderError }}</div>
                        <div class="flex justify-end gap-3 mt-6">
                            <button @click="showNewFolder = false" :disabled="creatingFolder" class="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50">Cancelar</button>
                            <button @click="createFolder" :disabled="creatingFolder" class="px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                                {{ creatingFolder ? 'Creando...' : 'Crear' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="card flex items-center justify-center py-16">
                <svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>

            <!-- Media Grid -->
            <div v-else-if="media.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                <div
                    v-for="file in media"
                    :key="file.id"
                    class="card group relative overflow-hidden"
                >
                    <!-- Preview -->
                    <div class="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                        <img
                            v-if="isImagePreview(file.format)"
                            :src="getFileUrl(file)"
                            :alt="file.original_name"
                            class="w-full h-full object-cover"
                        />
                        <svg v-else class="w-12 h-12" :class="file.type === 'video' ? 'text-blue-400' : 'text-orange-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="typeIcon(file.type)" />
                        </svg>
                        <!-- Duration badge -->
                        <span v-if="file.duration" class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-mono bg-black/70 text-white">{{ formatDuration(file.duration) }}</span>
                        <!-- Type badge -->
                        <span :class="typeColors[file.type]" class="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-medium">{{ typeLabels[file.type] }}</span>
                        <!-- Delete button (on hover) -->
                        <button
                            @click="deleteMedia(file)"
                            :disabled="deleting === file.id"
                            class="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                        >
                            <svg v-if="deleting === file.id" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <!-- Info -->
                    <div class="p-3">
                        <p class="text-xs font-medium text-gray-900 dark:text-white truncate" :title="file.original_name">{{ file.original_name }}</p>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-xs text-gray-400 uppercase">{{ file.format }}</span>
                            <span class="text-xs text-gray-400">{{ formatSize(file.size) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else-if="!loading" class="card flex flex-col items-center justify-center py-16 text-center">
                <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">Biblioteca vacía</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Sube archivos de audio o video para empezar</p>
                <button
                    @click="showUpload = true"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl transition-all"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir Archivos
                </button>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.last > 1" class="flex items-center justify-between text-sm">
                <span class="text-gray-400">{{ pagination.total }} archivos</span>
                <div class="flex gap-1">
                    <button :disabled="pagination.current <= 1" @click="fetchMedia(pagination.current - 1)" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all">Anterior</button>
                    <button :disabled="pagination.current >= pagination.last" @click="fetchMedia(pagination.current + 1)" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-all">Siguiente</button>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
