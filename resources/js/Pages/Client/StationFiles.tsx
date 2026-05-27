import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FolderOpen, Upload, Trash2, HardDrive, Music, FileAudio } from 'lucide-react';
import { useState, useRef } from 'react';
import StationLayout from './StationLayout';

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

interface PageProps {
    station: StationMini;
    files: FileItem[];
    storage: StorageData;
    flash: { success?: string; error?: string };
}

export default function StationFiles() {
    const { station, files, storage, flash } = usePage<any>().props as PageProps;
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { setData, post, processing, progress } = useForm({ file: null as File | null });

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
        // Post con pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
            post(`/dashboard/station/${station.id}/files`, {
                preserveScroll: true,
                onSuccess: () => setData('file', null),
            });
        }, 50);
    };

    const handleDelete = (fileId: number) => {
        if (confirm('¿Eliminar este archivo?')) {
            router.delete(`/dashboard/station/${station.id}/files/${fileId}`);
        }
    };

    const formatDuration = (seconds: number): string => {
        if (!seconds) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <StationLayout currentSection="files">
            <Head title={`${station.name} - Archivos`} />

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

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                            <FolderOpen className="w-5 h-5" />
                        </div>
                        Administrador de Archivos
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Gestión de archivos multimedia de la estación</p>
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
                <p className="text-sm font-semibold text-slate-400">
                    {dragOver ? 'Suelta el archivo aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-slate-600">MP3, OGG, FLAC, WAV, MP4, M4A — Máx. 50 MB</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.ogg,.flac,.wav,.mp4,.m4a"
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
                {files.length === 0 ? (
                    <div className="text-center py-16">
                        <FileAudio className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-base">No hay archivos</p>
                        <p className="text-xs text-slate-500 mt-1">Sube tus archivos multimedia para empezar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Archivo</th>
                                    <th className="p-4">Artista</th>
                                    <th className="p-4">Duración</th>
                                    <th className="p-4">Tamaño</th>
                                    <th className="p-4">Subido</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {files.map((f) => (
                                    <tr key={f.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                                                    <Music className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200">{f.title}</p>
                                                    <p className="text-xs text-slate-500">{f.filename}</p>
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
                                                title="Eliminar"
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
        </StationLayout>
    );
}
