<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import SidebarNav from '@/Components/SidebarNav.vue';

interface MediaFile { id: number; filename: string; original_name: string; path: string; type: 'audio'|'video'; format: string; size: number; duration: number|null; folder_id: number|null; created_at: string; folder: {id:number;name:string}|null; }
interface MediaFolder { id: number; name: string; parent_id: number|null; }

const media = ref<MediaFile[]>([]);
const folders = ref<MediaFolder[]>([]);
const loading = ref(true);
const search = ref('');
const typeFilter = ref('');
const currentFolder = ref<number|null>(null);
const showUpload = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');
const showNewFolder = ref(false);
const newFolderName = ref('');
const creatingFolder = ref(false);
const deleting = ref<number|null>(null);

async function fetchMedia() {
    loading.value = true;
    try {
        const params: any = {};
        if (currentFolder.value) params.folder_id = currentFolder.value;
        if (typeFilter.value) params.type = typeFilter.value;
        if (search.value) params.search = search.value;
        const { data } = await axios.get('/api/media', { params });
        media.value = data.media?.data || data.media || [];
        folders.value = data.folders || [];
    } catch (e) { console.error(e); }
    finally { loading.value = false; }
}

async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const fd = new FormData();
    for (const f of Array.from(input.files)) fd.append('files[]', f);
    if (currentFolder.value) fd.append('folder_id', String(currentFolder.value));
    uploading.value = true; uploadError.value = ''; uploadProgress.value = 0;
    try {
        await axios.post('/api/media/upload', fd, { headers:{'Content-Type':'multipart/form-data'}, onUploadProgress:(e)=>{ if(e.total) uploadProgress.value=Math.round((e.loaded*100)/e.total); } });
        input.value = ''; showUpload.value = false; await fetchMedia();
    } catch (e: any) { uploadError.value = e.response?.data?.message || 'Error'; }
    finally { uploading.value = false; }
}

async function createFolder() {
    if (!newFolderName.value.trim()) return;
    creatingFolder.value = true;
    try { await axios.post('/api/media/folders', { name: newFolderName.value, parent_id: currentFolder.value }); newFolderName.value = ''; showNewFolder.value = false; await fetchMedia(); }
    catch (e) { console.error(e); }
    finally { creatingFolder.value = false; }
}

async function deleteMedia(file: MediaFile) {
    if (!confirm(`¿Eliminar "${file.original_name}"?`)) return;
    deleting.value = file.id;
    try { await axios.delete(`/api/media/${file.id}`); media.value = media.value.filter(m=>m.id!==file.id); }
    catch (e) { alert('Error'); }
    finally { deleting.value = null; }
}

function formatSize(b: number) { if(b<1024) return `${b}B`; if(b<1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; }
function formatDuration(s: number|null) { if(!s) return ''; const m=Math.floor(s/60); const sec=Math.floor(s%60); return `${m}:${sec.toString().padStart(2,'0')}`; }

watch([search, typeFilter], ()=>fetchMedia());
onMounted(fetchMedia);
</script>

<template>
    <AuthenticatedLayout>
        <template #nav><SidebarNav /></template>
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h2 class="text-2xl font-bold text-gray-900 dark:text-white">Mi Biblioteca</h2><p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus archivos de audio y video</p></div>
                <div class="flex gap-2">
                    <button @click="showNewFolder=true" class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm rounded-xl transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>Nueva Carpeta</button>
                    <button @click="showUpload=true" class="inline-flex items-center gap-2 px-4 py-2.5 bg-tuistream-600 hover:bg-tuistream-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Subir Archivos</button>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input v-model="search" type="text" placeholder="Buscar archivos..." class="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:ring-2 focus:ring-tuistream-500 focus:border-transparent transition-all"/></div>
                <select v-model="typeFilter" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"><option value="">Todos</option><option value="audio">🎵 Audio</option><option value="video">🎬 Video</option></select>
            </div>

            <!-- Upload Modal -->
            <div v-if="showUpload" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showUpload=false">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Subir Archivos</h3>
                    <label class="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed rounded-2xl cursor-pointer border-gray-300 dark:border-gray-700 hover:border-tuistream-400 transition-all">
                        <svg class="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                        <span class="text-sm text-gray-500">Seleccionar archivos</span>
                        <input type="file" multiple accept="audio/*,video/*" class="hidden" @change="handleUpload"/>
                    </label>
                    <div v-if="uploading" class="mt-4"><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div class="bg-tuistream-500 h-2 rounded-full transition-all" :style="{width:uploadProgress+'%'}"/></div><p class="text-xs text-gray-400 text-center mt-1">{{ uploadProgress }}%</p></div>
                    <div v-if="uploadError" class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-sm text-red-700">{{ uploadError }}</div>
                    <div class="flex justify-end mt-6"><button @click="showUpload=false" :disabled="uploading" class="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl">Cancelar</button></div>
                </div>
            </div>

            <!-- New Folder Modal -->
            <div v-if="showNewFolder" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showNewFolder=false">
                <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Nueva Carpeta</h3>
                    <input v-model="newFolderName" type="text" placeholder="Nombre de la carpeta" class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm" @keyup.enter="createFolder"/>
                    <div class="flex justify-end gap-3 mt-6"><button @click="showNewFolder=false" :disabled="creatingFolder" class="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-xl">Cancelar</button><button @click="createFolder" :disabled="creatingFolder" class="px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl">{{ creatingFolder?'Creando...':'Crear' }}</button></div>
                </div>
            </div>

            <div v-if="loading" class="card flex items-center justify-center py-16"><svg class="animate-spin w-8 h-8 text-tuistream-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>

            <div v-else-if="media.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <div v-for="file in media" :key="file.id" class="card group relative overflow-hidden">
                    <div class="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                        <svg class="w-12 h-12" :class="file.type==='video'?'text-blue-400':'text-orange-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="file.type==='video'?'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z':'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'"/></svg>
                        <span v-if="file.duration" class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-mono bg-black/70 text-white">{{ formatDuration(file.duration) }}</span>
                        <button @click="deleteMedia(file)" :disabled="deleting===file.id" class="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                    <div class="p-3"><p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ file.original_name }}</p><div class="flex items-center justify-between mt-1"><span class="text-xs text-gray-400 uppercase">{{ file.format }}</span><span class="text-xs text-gray-400">{{ formatSize(file.size) }}</span></div></div>
                </div>
            </div>

            <div v-else-if="!loading" class="card flex flex-col items-center justify-center py-16 text-center">
                <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <p class="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">Biblioteca vacía</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Sube archivos de audio o video</p>
                <button @click="showUpload=true" class="inline-flex items-center gap-2 px-4 py-2 bg-tuistream-600 hover:bg-tuistream-700 text-white text-sm font-medium rounded-xl">Subir Archivos</button>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
