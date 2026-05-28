import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Trash2, Edit3, Disc, Settings, X, Check } from 'lucide-react';
import AudioStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface MountPoint {
    id: number; path: string; bitrate: number; format: string; is_default: boolean; is_public: boolean;
}

export default function AudioStationMountPoints() {
    const { station } = usePage<any>().props as any;
    const [mounts, setMounts] = useState<MountPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<{type:string;text:string}|null>(null);
    const [form, setForm] = useState({ path:'/radio.mp3', bitrate:128, format:'MP3', is_default:false, is_public:true });
    const [editing, setEditing] = useState<number|null>(null);

    const api = `/dashboard/station/${station.id}/mount-points`;

    const load = () => {
        setLoading(true);
        fetch(`${api}/list`, { headers: apiHeaders() })
            .then(r => r.json())
            .then(d => setMounts(d.mount_points || []))
            .catch(() => setMessage({type:'error',text:'Error al cargar puntos de montaje'}))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleCreate = () => {
        fetch(`${api}/store`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) { setMessage({type:'success',text:d.message}); setShowForm(false); load(); }
                else setMessage({type:'error',text:d.error||d.message||'Error'});
            })
            .catch(() => setMessage({type:'error',text:'Error de red'}));
    };

    const handleUpdate = (m: MountPoint) => {
        setEditing(m.id);
        setForm({ path:m.path, bitrate:m.bitrate, format:m.format, is_default:m.is_default, is_public:m.is_public });
        setShowForm(true);
    };

    const handleSaveEdit = () => {
        if (!editing) return;
        fetch(`${api}/${editing}`, {
            method: 'PUT',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) { setMessage({type:'success',text:d.message}); setShowForm(false); setEditing(null); load(); }
                else setMessage({type:'error',text:d.error||d.message||'Error'});
            })
            .catch(() => setMessage({type:'error',text:'Error de red'}));
    };

    const handleDelete = (m: MountPoint) => {
        if (!confirm(`¿Eliminar punto de montaje "${m.path}"?`)) return;
        fetch(`${api}/${m.id}`, { method: 'DELETE', headers: apiHeaders() })
            .then(r => r.json())
            .then(d => { if(d.success) load(); else setMessage({type:'error',text:d.error||'Error'}); })
            .catch(() => setMessage({type:'error',text:'Error al eliminar'}));
    };

    return (
        <AudioStationLayout currentSection="mountpoints">
            <Head title={`${station.name} - Puntos de Montaje`} />
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Disc className="w-4 h-4"/></div>
                        Puntos de Montaje
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Configura streams con distintos formatos y bitrates</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({path:'/radio.mp3',bitrate:128,format:'MP3',is_default:false,is_public:true}); setShowForm(true); }}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-xl text-sm ${message.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${message.type==='success'?'bg-emerald-400':'bg-red-400'}`}/>{message.text}
                </div>
            )}

            {loading ? <div className="text-center py-12 text-slate-500">Cargando...</div> : mounts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 rounded-2xl border border-slate-900 bg-slate-950/40">
                    <Disc className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-sm">Sin puntos de montaje</p>
                    <p className="text-[10px] mt-1 text-slate-600">Crea tu primer punto de montaje</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {mounts.map(m => (
                        <div key={m.id} className={`p-4 rounded-2xl border transition-all ${m.is_default ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-900 bg-slate-950/40'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${m.is_default ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                        <Disc className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-200 font-mono">{m.path}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] text-indigo-400 font-mono">{m.format}</span>
                                            <span className="text-[9px] text-slate-500">{m.bitrate} kbps</span>
                                            {m.is_default && <span className="text-[8px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded font-bold">DEFAULT</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleUpdate(m)} className="p-1.5 text-slate-600 hover:text-indigo-400 transition-colors"><Edit3 className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => handleDelete(m)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">{editing ? 'Editar' : 'Nuevo'} Punto de Montaje</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Path</label>
                                <input type="text" value={form.path} onChange={e => setForm({...form,path:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono" placeholder="/radio.mp3" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Bitrate (kbps)</label>
                                    <input type="number" min={16} max={320} value={form.bitrate} onChange={e => setForm({...form,bitrate:Number(e.target.value)})}
                                        className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Formato</label>
                                    <select value={form.format} onChange={e => setForm({...form,format:e.target.value})}
                                        className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200">
                                        <option value="MP3">MP3</option><option value="AAC">AAC</option><option value="OGG">OGG</option><option value="FLAC">FLAC</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form,is_default:e.target.checked})}
                                        className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-indigo-500" /> Default
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={form.is_public} onChange={e => setForm({...form,is_public:e.target.checked})}
                                        className="rounded bg-slate-950 border-slate-700 text-indigo-500 focus:ring-indigo-500" /> Público
                                </label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400">Cancelar</button>
                                <button onClick={editing ? handleSaveEdit : handleCreate} className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white">
                                    {editing ? 'Guardar Cambios' : 'Crear'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AudioStationLayout>
    );
}
