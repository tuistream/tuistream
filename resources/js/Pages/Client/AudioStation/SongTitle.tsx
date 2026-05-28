import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Music, RefreshCw, Edit3, Check, X } from 'lucide-react';
import AudioStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

export default function AudioStationSongTitle() {
    const { station, now_playing: initialTitle } = usePage<any>().props as any;
    const [title, setTitle] = useState(initialTitle || 'Reproduciendo…');
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(title);
    const [message, setMessage] = useState<{type:string;text:string}|null>(null);

    const api = `/dashboard/station/${station.id}/song-title`;

    const getNowPlaying = () => {
        fetch(`/dashboard/station/${station.id}/song-title`)
            .then(r => r.ok ? r.text().then(t => {
                // Intentar extraer el now_playing del payload de Inertia
                try { const m = t.match(/"now_playing"\s*:\s*"([^"]+)"/); if (m) setTitle(m[1]); } catch {}
            }) : null)
            .catch(() => {});
    };

    useEffect(() => {
        const interval = setInterval(getNowPlaying, 15000);
        return () => clearInterval(interval);
    }, []);

    const saveTitle = () => {
        fetch(`${api}/update`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editValue }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setTitle(d.now_playing);
                    setEditValue(d.now_playing);
                    setEditing(false);
                    setMessage({ type: 'success', text: d.message });
                } else {
                    setMessage({ type: 'error', text: d.error || 'Error' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }));
    };

    const fetchNowPlaying = () => {
        fetch(`${api}/update`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setTitle(d.now_playing);
                    setMessage({ type: 'success', text: 'Metadato actualizado en el stream' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al actualizar' }));
    };

    return (
        <AudioStationLayout currentSection="songtitle">
            <Head title={`${station.name} - Título de Canción`} />
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Music className="w-4 h-4"/></div>
                        Título de Canción
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Visualiza y edita el metadato del stream en tiempo real</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchNowPlaying} className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
                        <RefreshCw className="w-3 h-3" /> Sincronizar
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-xl text-sm ${message.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${message.type==='success'?'bg-emerald-400':'bg-red-400'}`}/>{message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
                <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Music className="w-4 h-4 text-indigo-400"/> Reproduciendo Ahora
                    </h3>
                    {editing ? (
                        <div className="space-y-3">
                            <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold text-center outline-none focus:border-indigo-500"
                                autoFocus />
                            <div className="flex gap-2">
                                <button onClick={() => { setEditing(false); setEditValue(title); }}
                                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1">
                                    <X className="w-3.5 h-3.5"/> Cancelar
                                </button>
                                <button onClick={saveTitle}
                                    className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5"/> Guardar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-lg font-bold text-white font-mono">{title}</p>
                            <button onClick={() => { setEditValue(title); setEditing(true); }}
                                className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400 transition-all inline-flex items-center gap-1.5">
                                <Edit3 className="w-3 h-3"/> Editar Manualmente
                            </button>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-6">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Historial Reciente</h3>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-2.5 flex items-center justify-between rounded-lg border border-slate-900 bg-slate-950/50 text-xs text-slate-500">
                                <span>—</span>
                                <span className="font-mono text-[10px]">hace {i+1} min</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-4 text-center">
                        El historial se llena automáticamente cuando el AutoDJ o encoder externo envía metadatos al servidor Icecast.
                    </p>
                </div>
            </div>
        </AudioStationLayout>
    );
}
