import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ListMusic, Plus, Music, Trash2, X, Save, ChevronDown, ChevronRight, Edit3, Clock } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData { id: number; name: string; }

interface PlaylistData {
    id: number; station_id: number; name: string; type: string;
    is_active: boolean; play_mode: string; media_files_count: number; created_at: string;
}

interface MediaFileItem { id: number; title: string; artist: string; filename: string; duration: number | null; }

interface PlaylistDetail { id: number; name: string; type: string; is_active: boolean; play_mode: string; media_files: MediaFileItem[]; }

interface PageProps { station: StationData; }

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': getCsrfToken(),
});

export default function AudioStationPlaylists() {
    const { station } = usePage<any>().props as PageProps;
    const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'standard', play_mode: 'sequential' });
    const [feedback, setFeedback] = useState<{ type: string; text: string } | null>(null);

    // Expand & Edit state
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [expandedData, setExpandedData] = useState<PlaylistDetail | null>(null);
    const [expandedLoading, setExpandedLoading] = useState(false);

    // Edit modal state
    const [editPlaylist, setEditPlaylist] = useState<PlaylistDetail | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const apiBase = `/dashboard/station/${station.id}/playlists`;

    const fetchPlaylists = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/list`, { headers: apiHeaders() });
            if (res.ok) setPlaylists(await res.json());
        } catch { /* keep current list */ }
        setLoading(false);
    }, [apiBase]);

    useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

    // ─── CREATE ────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        try {
            const res = await fetch(`${apiBase}/store`, {
                method: 'POST',
                headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const data = await res.json();
                setFeedback({ type: 'success', text: `Playlist "${form.name}" creada.` });
                setShowCreate(false);
                setForm({ name: '', type: 'standard', play_mode: 'sequential' });
                fetchPlaylists();
            } else {
                const err = await res.json();
                setFeedback({ type: 'error', text: err.message || Object.values(err.errors || {}).flat().join(', ') || 'Error al crear' });
            }
        } catch {
            setFeedback({ type: 'error', text: 'Error de red al crear playlist' });
        }
    };

    // ─── TOGGLE ────────────────────────────────────────────────────────
    const handleToggle = async (pl: PlaylistData) => {
        setFeedback(null);
        try {
            const res = await fetch(`${apiBase}/${pl.id}/toggle`, {
                method: 'POST',
                headers: apiHeaders(),
            });
            if (res.ok) {
                fetchPlaylists();
                const data = await res.json();
                setFeedback({ type: 'success', text: `Playlist "${pl.name}" ${data.is_active ? 'activada' : 'desactivada'}.` });
            }
        } catch { setFeedback({ type: 'error', text: 'Error al cambiar estado' }); }
    };

    // ─── DELETE ────────────────────────────────────────────────────────
    const handleDelete = async (pl: PlaylistData) => {
        if (!confirm(`¿Eliminar la playlist "${pl.name}"?`)) return;
        setFeedback(null);
        try {
            await fetch(`${apiBase}/${pl.id}`, {
                method: 'DELETE',
                headers: apiHeaders(),
            });
            if (expandedId === pl.id) { setExpandedId(null); setExpandedData(null); }
            if (editPlaylist?.id === pl.id) setEditPlaylist(null);
            fetchPlaylists();
            setFeedback({ type: 'success', text: `Playlist "${pl.name}" eliminada.` });
        } catch { setFeedback({ type: 'error', text: 'Error al eliminar' }); }
    };

    // ─── EXPAND / COLLAPSE ─────────────────────────────────────────────
    const toggleExpand = async (pl: PlaylistData) => {
        if (expandedId === pl.id) {
            setExpandedId(null);
            setExpandedData(null);
            return;
        }
        setExpandedId(pl.id);
        setExpandedLoading(true);
        try {
            const res = await fetch(`${apiBase}/${pl.id}/media`, { headers: apiHeaders() });
            if (res.ok) {
                const data = await res.json();
                setExpandedData(data.playlist);
            }
        } catch { setFeedback({ type: 'error', text: 'Error al cargar canciones' }); }
        setExpandedLoading(false);
    };

    // ─── EDIT MODAL ────────────────────────────────────────────────────
    const openEdit = async (pl: PlaylistData) => {
        setEditLoading(true);
        try {
            const res = await fetch(`${apiBase}/${pl.id}/media`, { headers: apiHeaders() });
            if (res.ok) {
                const data = await res.json();
                setEditPlaylist(data.playlist);
            }
        } catch { setFeedback({ type: 'error', text: 'Error al cargar playlist' }); }
        setEditLoading(false);
    };

    const removeSongFromPlaylist = async (playlistId: number, mediaId: number) => {
        try {
            const res = await fetch(`${apiBase}/${playlistId}/remove-media`, {
                method: 'POST',
                headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_id: mediaId }),
            });
            if (res.ok) {
                if (editPlaylist) {
                    setEditPlaylist({
                        ...editPlaylist,
                        media_files: editPlaylist.media_files.filter(m => m.id !== mediaId),
                    });
                }
                if (expandedId === playlistId) {
                    setExpandedId(null); // recargaría al expandir de nuevo
                    setExpandedData(null);
                }
                fetchPlaylists();
                setFeedback({ type: 'success', text: 'Canción removida de la playlist.' });
            }
        } catch { setFeedback({ type: 'error', text: 'Error al remover canción' }); }
    };

    const formatDuration = (s: number | null) => {
        if (!s || s <= 0) return '--:--';
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // ─── RENDER ────────────────────────────────────────────────────────
    return (
        <AudioStationLayout currentSection="playlists">
            <Head title={`${station.name} - Listas de Reproducción`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><ListMusic className="w-4 h-4" /></div>
                        Listas de Reproducción
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Gestione listas musicales y programaciones para AutoDJ</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Crear Nueva Lista
                </button>
            </div>

            {feedback && (
                <div className={`mb-4 p-3 rounded-xl border text-xs font-medium ${
                    feedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>{feedback.text}</div>
            )}

            {/* ═══ CREATE MODAL ═══ */}
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
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Modo de reproducción</label>
                                <select value={form.play_mode} onChange={e => setForm({...form, play_mode: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                                    <option value="sequential">Secuencial</option>
                                    <option value="shuffle">Aleatorio (Shuffle)</option>
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

            {/* ═══ TABLE ═══ */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="p-4 w-8"></th>
                                <th className="p-4">Lista</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Canciones</th>
                                <th className="p-4">Modo</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-xs">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Cargando listas...</td></tr>
                            ) : playlists.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No hay listas. ¡Cree una!</td></tr>
                            ) : (
                                playlists.map((pl) => (
                                    <React.Fragment key={pl.id}>
                                        <tr className="hover:bg-slate-950/30 transition-colors">
                                            <td className="p-4 w-8">
                                                <button onClick={() => toggleExpand(pl)} className="p-1 text-slate-500 hover:text-white transition-colors">
                                                    {expandedId === pl.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="p-4 font-bold text-slate-200">{pl.name}</td>
                                            <td className="p-4 text-slate-400 capitalize">{pl.type}</td>
                                            <td className="p-4 font-mono font-bold text-slate-300">{pl.media_files_count}</td>
                                            <td className="p-4 text-slate-400 capitalize">{pl.play_mode === 'shuffle' ? 'Aleatorio' : 'Secuencial'}</td>
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
                                            <td className="p-4 w-24">
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEdit(pl)} disabled={editLoading && editPlaylist?.id !== pl.id}
                                                        className="p-2 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-all" title="Editar canciones">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(pl)}
                                                        className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all" title="Eliminar playlist">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ═══ EXPANDED SONGS ═══ */}
                {expandedId !== null && (
                    <div className="border-t border-slate-900 bg-slate-950/30">
                        <div className="p-4 pl-12">
                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Music className="w-3.5 h-3.5 text-indigo-400" />
                                Canciones en &ldquo;{expandedData?.name || '...'}&rdquo;
                            </h4>
                            {expandedLoading ? (
                                <div className="text-center py-6 text-slate-500 text-xs">Cargando canciones...</div>
                            ) : !expandedData || expandedData.media_files.length === 0 ? (
                                <div className="text-center py-6 text-slate-600 text-xs">
                                    <Music className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                                    <p>Esta playlist está vacía.</p>
                                    <p className="text-[10px] mt-1">Agrega canciones desde la sección Medios usando &ldquo;Agregar a Playlist&rdquo;.</p>
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-72 overflow-y-auto pr-2">
                                    {expandedData.media_files.map((m, i) => (
                                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[10px] text-slate-600 font-mono w-5 text-right">{i + 1}</span>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-300 truncate">{m.title || m.filename}</p>
                                                    {m.artist && <p className="text-[9px] text-slate-500 truncate">{m.artist}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDuration(m.duration)}
                                                </span>
                                                <button onClick={() => removeSongFromPlaylist(expandedId, m.id)}
                                                    className="p-1 text-slate-600 hover:text-red-400 transition-colors rounded" title="Remover de la playlist">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ EDIT MODAL ═══ */}
            {editPlaylist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900 shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-white">Editar &ldquo;{editPlaylist.name}&rdquo;</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">{editPlaylist.media_files.length} canción(es) — Elimina las que no quieras</p>
                            </div>
                            <button onClick={() => setEditPlaylist(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 space-y-2">
                            {editPlaylist.media_files.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <Music className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                                    <p className="text-sm">Sin canciones en esta playlist</p>
                                    <p className="text-[10px] text-slate-600 mt-1">Ve a Medios, selecciona archivos y usa &ldquo;Agregar a Playlist&rdquo;.</p>
                                </div>
                            ) : (
                                editPlaylist.media_files.map((m, i) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-[10px] text-slate-600 font-mono w-6 text-right">{i + 1}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-300 truncate">{m.title || m.filename}</p>
                                                {m.artist && <p className="text-[9px] text-slate-500 truncate">{m.artist}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[10px] text-slate-600 font-mono">{formatDuration(m.duration)}</span>
                                            <button onClick={() => removeSongFromPlaylist(editPlaylist.id, m.id)}
                                                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Remover">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-900 shrink-0 flex gap-2">
                            <button onClick={() => setEditPlaylist(null)}
                                className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:text-white transition-all">Cerrar</button>
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
