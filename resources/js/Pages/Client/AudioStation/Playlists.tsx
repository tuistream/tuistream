import { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ListMusic, Plus, Play, Music, Edit, Trash2, X, Save, ListPlus } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PlaylistData {
    id: number;
    station_id: number;
    name: string;
    type: string;
    is_active: boolean;
    play_mode: string;
    media_files_count: number;
    created_at: string;
}

interface MediaFileItem {
    id: number;
    title: string;
    artist: string;
    filename: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationPlaylists() {
    const { station } = usePage<any>().props as PageProps;
    const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'standard', play_mode: 'sequential' });

    const apiBase = `/dashboard/station/${station.id}/playlists`;

    const fetchPlaylists = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/list`, { headers: { 'Accept': 'application/json' } });
            if (res.ok) setPlaylists(await res.json());
        } catch { /* keep current list */ }
        setLoading(false);
    }, [apiBase]);

    useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBase}/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify(form),
            });
            if (res.ok) { setShowCreate(false); setForm({ name: '', type: 'standard', play_mode: 'sequential' }); fetchPlaylists(); }
        } catch { /* handle error */ }
    };

    const handleToggle = async (pl: PlaylistData) => {
        try {
            await fetch(`${apiBase}/${pl.id}/toggle`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrfToken() },
            });
            fetchPlaylists();
        } catch { /* handle error */}
    };

    const handleDelete = async (pl: PlaylistData) => {
        if (!confirm(`¿Eliminar la playlist "${pl.name}"?`)) return;
        try {
            await fetch(`${apiBase}/${pl.id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': getCsrfToken() },
            });
            fetchPlaylists();
        } catch { /* handle error */ }
    };

    return (
        <AudioStationLayout currentSection="playlists">
            <Head title={`${station.name} - Listas de Reproducción`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <ListMusic className="w-4 h-4" />
                        </div>
                        Listas de Reproducción
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Gestione listas musicales y programaciones para AutoDJ</p>
                </div>

                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Crear Nueva Lista
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                            <h3 className="text-sm font-bold text-white">Nueva Lista de Reproducción</h3>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Nombre</label>
                                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Tipo</label>
                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                                    <option value="standard">Standard (Rotación)</option>
                                    <option value="scheduled">Programada (Horario)</option>
                                    <option value="weighted">Ponderada (Peso)</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancelar</button>
                                <button type="submit"
                                    className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                                    <Save className="w-3.5 h-3.5" /> Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="p-4">Lista</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Canciones</th>
                                <th className="p-4">Modo</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-xs">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Cargando listas...</td></tr>
                            ) : playlists.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No hay listas. ¡Cree una!</td></tr>
                            ) : (
                                playlists.map((pl) => (
                                    <tr key={pl.id} className="hover:bg-slate-900/30 transition-all">
                                        <td className="p-4 font-bold text-slate-200">{pl.name}</td>
                                        <td className="p-4 text-slate-400 capitalize">{pl.type}</td>
                                        <td className="p-4 font-mono font-bold text-slate-300">{pl.media_files_count}</td>
                                        <td className="p-4 text-slate-400 capitalize">{pl.play_mode}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleToggle(pl)}
                                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
                                                    pl.is_active
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                                }`}>
                                                {pl.is_active ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </td>
                                        <td className="p-4 flex gap-1">
                                            <button onClick={() => handleDelete(pl)}
                                                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AudioStationLayout>
    );
}

function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? (meta as HTMLMetaElement).content : '';
}
