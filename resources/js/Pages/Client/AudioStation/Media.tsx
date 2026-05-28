import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FolderOpen, Upload, Trash2, HardDrive, Music, FileAudio, ListPlus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import AudioStationLayout from './Layout';

interface FileItem {
    id: number;
    filename: string;
    title: string;
    artist: string;
    duration: number;
    size: number;
    size_formatted: string;
    created_at: string;
}

interface StationMini {
    id: number;
    name: string;
    type: 'audio' | 'video';
}

interface StorageData {
    used: number;
    used_formatted: string;
    limit: number;
    limit_formatted: string;
    percent: number;
}

interface PlaylistOption {
    id: number;
    name: string;
}

interface PageProps {
    station: StationMini;
    files: FileItem[];
    storage: StorageData;
    flash: { success?: string; error?: string };
}

export default function AudioStationMedia() {
    const { station, files, storage, flash } = usePage<any>().props as PageProps;
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setData, post, processing, progress } = useForm({ file: null as File | null });
    const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState<{type:string;text:string}|null>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) uploadFile(dropped);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) uploadFile(selected);
    };

    const uploadFile = (file: File) => {
        setData('file', file);
        setTimeout(() => {
            post(`/dashboard/station/${station.id}/media`, {
                preserveScroll: true,
                onSuccess: () => setData('file', null),
            });
        }, 50);
    };

    const handleDelete = (fileId: number) => {
        if (confirm('¿Eliminar este archivo de música?')) {
            router.delete(`/dashboard/station/${station.id}/media/${fileId}`);
        }
    };

    const formatDuration = (seconds: number): string => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const fetchPlaylists = useCallback(async () => {
        try {
            const res = await fetch(`/dashboard/station/${station.id}/playlists/list`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (res.ok) setPlaylists(await res.json());
        } catch { /* keep current */ }
    }, [station.id]);

    useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

    const toggleFileSelection = (fileId: number) => {
        setSelectedFiles(prev =>
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedFiles.length === files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(files.map(f => f.id));
        }
    };

    const handleCreatePlaylistAndAdd = async () => {
        if (!newPlaylistName.trim() || selectedFiles.length === 0) return;
        setCreating(true);
        try {
            const r = await fetch(`/dashboard/station/${station.id}/playlists/store`, {
                method: 'POST',
                headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPlaylistName.trim(), type: 'standard' }),
            });
            if (!r.ok) throw new Error('Error');
            const newList = await r.json();

            if (newList.playlist?.id) {
                await fetch(`/dashboard/station/${station.id}/playlists/${newList.playlist.id}/add-media`, {
                    method: 'POST',
                    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({ media_ids: selectedFiles }),
                });
                setMessage({ type: 'success', text: `Playlist "${newPlaylistName}" creada con ${selectedFiles.length} archivos.` });
                setShowCreatePlaylist(false);
                setNewPlaylistName('');
                await fetchPlaylists();
            }
        } catch {
            setMessage({ type: 'error', text: 'Error al crear playlist' });
        } finally { setCreating(false); }
    };

    const handleAddToPlaylist = async () => {
        if (!selectedPlaylist || selectedFiles.length === 0) return;
        try {
            await fetch(`/dashboard/station/${station.id}/playlists/${selectedPlaylist}/add-media`, {
                method: 'POST',
                headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_ids: selectedFiles }),
            });
            setSelectedFiles([]);
            setSelectedPlaylist(null);
            setShowAddToPlaylist(false);
        } catch { /* handle error */ }
    };

    return (
        <AudioStationLayout currentSection="media">
            <Head title={`${station.name} - Medios de comunicación`} />

            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> {flash.error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <FolderOpen className="w-4 h-4" />
                        </div>
                        Medios de comunicación
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Cargue y gestione la biblioteca de archivos de música para AutoDJ</p>
                </div>
            </div>

            {/* Storage bar */}
            <div className="mb-6 p-5 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Almacenamiento
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{storage.used_formatted} / {storage.limit_formatted} ({storage.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(storage.percent, 100)}%` }}
                    />
                </div>
            </div>

            {/* Upload zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-6 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    dragOver
                        ? 'border-indigo-500 bg-indigo-500/5'
                        : 'border-slate-900 bg-slate-900/20 hover:border-slate-700'
                }`}
            >
                <Upload className={`w-8 h-8 ${dragOver ? 'text-indigo-400' : 'text-slate-600'}`} />
                <p className="text-xs font-semibold text-slate-400">
                    {dragOver ? 'Suelta el archivo aquí' : 'Arrastra archivos MP3 aquí o haz clic para seleccionar'}
                </p>
                <p className="text-[10px] text-slate-600">Archivos MP3, OGG, FLAC, WAV, M4A — Máx. 3 GB</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.ogg,.flac,.wav,.m4a"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Progress bar */}
            {processing && progress && (
                <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-900">
                    <span className="text-xs text-slate-400 block mb-2">Subiendo...</span>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
                    </div>
                </div>
            )}

            {/* File list */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                {files.length > 0 && (
                    <div className="px-4 py-3 border-b border-slate-900 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">{files.length} archivos</span>
                        {selectedFiles.length > 0 && (
                            <button
                                onClick={() => setShowAddToPlaylist(true)}
                                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                                <ListPlus className="w-3 h-3" /> Agregar a playlist ({selectedFiles.length})
                            </button>
                        )}
                    </div>
                )}
                {files.length === 0 ? (
                    <div className="text-center py-16">
                        <FileAudio className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-sm">No hay archivos</p>
                        <p className="text-xs text-slate-500 mt-1">Sube tus canciones para que AutoDJ comience a reproducirlas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                    <th className="p-4 w-8">
                                        <input type="checkbox" checked={selectedFiles.length === files.length && files.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500" />
                                    </th>
                                    <th className="p-4">Canción / Archivo</th>
                                    <th className="p-4">Artista</th>
                                    <th className="p-4">Duración</th>
                                    <th className="p-4">Tamaño</th>
                                    <th className="p-4">Subido</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {files.map((f) => (
                                    <tr key={f.id} className={`hover:bg-slate-900/30 transition-all text-xs ${selectedFiles.includes(f.id) ? 'bg-indigo-500/5' : ''}`}>
                                        <td className="p-4">
                                            <input type="checkbox" checked={selectedFiles.includes(f.id)}
                                                onChange={() => toggleFileSelection(f.id)}
                                                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-500 cursor-pointer" />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                                                    <Music className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-200 truncate max-w-[250px]">{f.title}</p>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[250px]">{f.filename}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400">{f.artist}</td>
                                        <td className="p-4 text-xs font-mono text-slate-400">{formatDuration(f.duration)}</td>
                                        <td className="p-4 text-xs text-slate-400">{f.size_formatted}</td>
                                        <td className="p-4 text-xs text-slate-500">{f.created_at}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDelete(f.id)}
                                                className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                                title="Eliminar archivo"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add to Playlist Modal */}
            {showAddToPlaylist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                            <h3 className="text-sm font-bold text-white">Agregar a Playlist</h3>
                            <button onClick={() => setShowAddToPlaylist(false)} className="text-slate-500 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-slate-400">{selectedFiles.length} archivo(s) seleccionado(s)</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {playlists.map(pl => (
                                    <button key={pl.id}
                                        onClick={() => setSelectedPlaylist(pl.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                                            selectedPlaylist === pl.id
                                                ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}>
                                        {pl.name}
                                    </button>
                                ))}
                                {playlists.length === 0 && !showCreatePlaylist && (
                                    <p className="text-xs text-slate-500 py-2 text-center">No hay playlists.</p>
                                )}
                            </div>

                            {showCreatePlaylist ? (
                                <div className="space-y-2">
                                    <input type="text" value={newPlaylistName} onChange={e => setNewPlaylistName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-200"
                                        placeholder="Nombre de la nueva playlist" autoFocus />
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowCreatePlaylist(false)}
                                            className="flex-1 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400">Cancelar</button>
                                        <button onClick={handleCreatePlaylistAndAdd} disabled={creating || !newPlaylistName.trim()}
                                            className="flex-1 py-1.5 bg-indigo-500 disabled:opacity-40 rounded-lg text-[10px] font-bold text-white">
                                            {creating ? 'Creando...' : 'Crear y Agregar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowCreatePlaylist(true)}
                                    className="w-full py-2 bg-slate-900 border border-slate-800 border-dashed rounded-lg text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all">
                                    + Crear nueva playlist
                                </button>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddToPlaylist(false)}
                                    className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancelar</button>
                                <button onClick={handleAddToPlaylist} disabled={!selectedPlaylist}
                                    className="flex-1 py-2 bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold">Agregar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AudioStationLayout>
    );
}

function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? (meta as HTMLMetaElement).content : '';
}

function apiHeaders() {
    return {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
    };
}
