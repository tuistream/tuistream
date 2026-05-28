import { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Trash2, Play, Pause, Music, Settings, Volume2, Upload, ToggleLeft, ToggleRight, X, AlertCircle, CheckCircle } from 'lucide-react';
import AudioStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface Jingle {
    id: number; name: string; filename: string; path: string; url: string;
    duration: number; interval: number; is_active: boolean; created_at: string;
}

export default function AudioStationJingles() {
    const { station } = usePage<any>().props as any;
    const [jingles, setJingles] = useState<Jingle[]>([]);
    const [interval, setIntervalValue] = useState(4);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const api = `/dashboard/station/${station.id}/jingles`;

    const loadJingles = () => {
        setLoading(true);
        fetch(`${api}/list`, { headers: apiHeaders() })
            .then(r => r.json())
            .then(data => { setJingles(data.jingles || []); })
            .catch(() => setMessage({ type: 'error', text: 'Error al cargar jingles' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadJingles(); }, []);

    const playJingle = (j: Jingle) => {
        if (playingId === j.id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = j.url;
            audioRef.current.load();
            audioRef.current.play().catch(() => setMessage({ type: 'error', text: 'No se pudo reproducir: archivo no encontrado en el servidor.' }));
            audioRef.current.onended = () => setPlayingId(null);
        }
        setPlayingId(j.id);
    };

    const uploadJingle = (e: FormEvent) => {
        e.preventDefault();
        const file = fileRef.current?.files?.[0];
        if (!file) { setMessage({ type: 'error', text: 'Selecciona un archivo de audio.' }); return; }
        if (!formData.name.trim()) { setMessage({ type: 'error', text: 'El nombre es requerido' }); return; }

        setUploading(true);
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('file', file);
        fd.append('interval', String(interval));

        fetch(`${api}/store`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': apiHeaders()['X-CSRF-TOKEN'] },
            body: fd,
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setMessage({ type: 'success', text: data.message });
                    setShowUpload(false);
                    setFormData({ name: '' });
                    if (fileRef.current) fileRef.current.value = '';
                    loadJingles();
                } else {
                    setMessage({ type: 'error', text: data.message || Object.values(data.errors || {}).flat().join(', ') || 'Error al subir' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red al subir jingle' }))
            .finally(() => setUploading(false));
    };

    const toggleJingle = (j: Jingle) => {
        fetch(`${api}/${j.id}`, {
            method: 'PUT',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !j.is_active }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) loadJingles();
                else setMessage({ type: 'error', text: data.message || 'Error' });
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al cambiar estado' }));
    };

    const deleteJingle = (j: Jingle) => {
        if (!confirm(`¿Eliminar "${j.name}"?`)) return;
        fetch(`${api}/${j.id}`, { method: 'DELETE', headers: apiHeaders() })
            .then(async r => {
                const data = await r.json();
                if (r.ok && data.success) {
                    loadJingles();
                    setMessage({ type: 'success', text: `Jingle "${j.name}" eliminado.` });
                } else {
                    setMessage({ type: 'error', text: data.error || data.message || 'Error al eliminar' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red al eliminar' }));
    };

    const saveSettings = () => {
        fetch(`${api}/settings`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ interval }),
        })
            .then(r => r.json())
            .then(data => setMessage({ type: data.success ? 'success' : 'error', text: data.message || data.error }))
            .catch(() => setMessage({ type: 'error', text: 'Error al guardar intervalo' }));
    };

    const formatDuration = (s: number) => {
        if (!s || s <= 0) return '--:--';
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // Cleanup audio on unmount
    useEffect(() => { return () => { audioRef.current?.pause(); }; }, []);

    return (
        <AudioStationLayout currentSection="jingles">
            <Head title={`${station.name} - Jingles`} />
            {/* Hidden audio element for playback */}
            <audio ref={audioRef} preload="none" className="hidden" />

            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Volume2 className="w-4 h-4"/></div>
                        Jingles
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Cuñas, IDs y promos que suenan entre canciones</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                    <Upload className="w-3.5 h-3.5" /> Subir Jingle
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-2 ${
                    message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                    <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-5">
                        <div className="flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-indigo-400"/><h3 className="text-xs font-bold text-slate-300 uppercase">Intervalo</h3></div>
                        <label className="text-[10px] text-slate-500 uppercase block mb-1.5">Cada cuántas canciones suena un jingle:</label>
                        <div className="flex gap-2">
                            <input type="number" min={1} max={999} value={interval} onChange={e => setIntervalValue(Number(e.target.value))}
                                className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono" />
                            <button onClick={saveSettings} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all">Guardar</button>
                        </div>
                        <p className="text-[9px] text-slate-600 mt-2">Ejemplo: con intervalo 4, sonará un jingle después de cada 4 canciones.</p>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                        <div className="p-4 border-b border-slate-900 flex items-center gap-2">
                            <Music className="w-4 h-4 text-indigo-400"/><h3 className="text-xs font-bold text-slate-300 uppercase">Archivos ({jingles.length})</h3>
                        </div>
                        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                            {loading ? <div className="text-center py-8 text-slate-500 text-sm">Cargando...</div> :
                             jingles.length === 0 ? <div className="text-center py-12 text-slate-500"><Volume2 className="w-8 h-8 mx-auto mb-2 text-slate-600"/><p className="text-sm">Sin jingles</p><p className="text-[10px] text-slate-600 mt-0.5">Sube tu primer jingle para empezar</p></div> :
                             jingles.map(j => (
                                <div key={j.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                    j.is_active ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-slate-900 bg-slate-950'
                                } ${playingId === j.id ? 'ring-1 ring-indigo-500/50' : ''}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button onClick={() => playJingle(j)}
                                            className={`p-2 rounded-lg transition-all ${
                                                playingId === j.id
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                                            }`}>
                                            {playingId === j.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-300 truncate">{j.name}</p>
                                            <p className="text-[9px] text-slate-500 font-mono truncate">{j.filename}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] text-slate-500 font-mono tabular-nums w-10 text-right">{formatDuration(j.duration)}</span>
                                        <button onClick={() => toggleJingle(j)} title={j.is_active ? 'Desactivar' : 'Activar'}>
                                            {j.is_active ? <ToggleRight className="w-5 h-5 text-indigo-400 hover:text-indigo-300" /> : <ToggleLeft className="w-5 h-5 text-slate-600 hover:text-slate-500" />}
                                        </button>
                                        <button onClick={() => deleteJingle(j)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showUpload && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Subir Jingle</h3>
                            <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={uploadJingle} className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Nombre del Jingle</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ name: e.target.value })} required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200" placeholder="ej. Identificación de emisora" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Archivo de Audio</label>
                                <input type="file" ref={fileRef} accept=".mp3,.wav,.ogg,.flac" required
                                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 file:cursor-pointer cursor-pointer" />
                                <p className="text-[9px] text-slate-600 mt-1">Formatos aceptados: MP3, WAV, OGG, FLAC — Máx. 100 MB</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowUpload(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold rounded-xl hover:text-white transition-all">Cancelar</button>
                                <button type="submit" disabled={uploading}
                                    className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                    {uploading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Subiendo...</> : <><Upload className="w-3.5 h-3.5"/> Subir</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AudioStationLayout>
    );
}
