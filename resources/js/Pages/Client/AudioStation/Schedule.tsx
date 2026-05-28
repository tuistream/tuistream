import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Trash2, Clock, Calendar, Music, Mic, ListMusic, Volume2, Play } from 'lucide-react';
import AudioStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface Slot {
    id: number; day: number; day_name: string; start_time: string; end_time: string;
    type: string; playlist_id: number | null; playlist_name: string | null; title: string;
}

const DAYS = [1,2,3,4,5,6,7];
const DAY_NAMES: Record<number,string> = {1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado',7:'Domingo'};
const TYPE_ICONS: Record<string,any> = {rotation:Play,dj_live:Mic,playlist:ListMusic,jingles:Volume2};
const TYPE_LABELS: Record<string,string> = {rotation:'Rotación',dj_live:'DJ en Vivo',playlist:'Playlist',jingles:'Jingles'};

export default function AudioStationSchedule() {
    const { station } = usePage<any>().props as any;
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState<{type:string;text:string}|null>(null);
    const [form, setForm] = useState({ day:1, start_time:'08:00', end_time:'12:00', type:'rotation', playlist_id:'', title:'' });

    const api = `/dashboard/station/${station.id}/schedule`;

    const load = () => {
        setLoading(true);
        fetch(`${api}/list`, { headers: apiHeaders() })
            .then(r => r.json())
            .then(d => setSlots(d.slots || []))
            .catch(() => setMessage({ type: 'error', text: 'Error al cargar horarios' }))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleCreate = () => {
        fetch(`${api}/store`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                day: form.day,
                start_time: form.start_time,
                end_time: form.end_time,
                type: form.type,
                playlist_id: form.playlist_id || null,
                title: form.title,
            }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setMessage({ type: 'success', text: 'Evento creado' });
                    setShowForm(false);
                    setForm({ day:1, start_time:'08:00', end_time:'12:00', type:'rotation', playlist_id:'', title:'' });
                    load();
                } else {
                    setMessage({ type: 'error', text: d.error || 'Error' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }));
    };

    const handleDelete = (s: Slot) => {
        if (!confirm(`¿Eliminar el evento "${s.title || TYPE_LABELS[s.type]}"?`)) return;
        fetch(`${api}/${s.id}`, { method: 'DELETE', headers: apiHeaders() })
            .then(r => r.json())
            .then(d => { if (d.success) load(); else setMessage({type:'error',text:d.error||'Error'}); })
            .catch(() => setMessage({type:'error',text:'Error al eliminar'}));
    };

    const slotsByDay = (day: number) => slots.filter(s => s.day === day);

    return (
        <AudioStationLayout currentSection="schedule">
            <Head title={`${station.name} - Programación`} />
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Calendar className="w-4 h-4"/></div>
                        Programación
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Arma la parrilla semanal de tu emisora</p>
                </div>
                <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Agregar Evento
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${message.type==='success'?'bg-emerald-400':'bg-red-400'}`}/>{message.text}
                </div>
            )}

            {loading ? <div className="text-center py-12 text-slate-500">Cargando programación...</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {DAYS.map(day => (
                        <div key={day} className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                            <div className="p-3 border-b border-slate-900 bg-slate-900/30">
                                <h3 className="text-xs font-bold text-slate-300 uppercase text-center">{DAY_NAMES[day]}</h3>
                            </div>
                            <div className="p-2 space-y-1.5 min-h-[120px] max-h-[350px] overflow-y-auto">
                                {slotsByDay(day).length === 0 ? (
                                    <div className="text-center py-6 text-slate-600 text-[10px]">Sin eventos</div>
                                ) : (
                                    slotsByDay(day).map(s => {
                                        const Icon = TYPE_ICONS[s.type] || Music;
                                        return (
                                            <div key={s.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-indigo-500/30 transition-all group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="w-3.5 h-3.5 text-indigo-400"/>
                                                        <span className="text-[10px] font-bold text-slate-300">{s.title || TYPE_LABELS[s.type]}</span>
                                                    </div>
                                                    <button onClick={() => handleDelete(s)} className="p-0.5 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3"/></button>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <Clock className="w-3 h-3 text-slate-600"/>
                                                    <span className="text-[9px] font-mono text-slate-500">{s.start_time} - {s.end_time}</span>
                                                </div>
                                                {s.playlist_name && <div className="text-[9px] text-slate-600 mt-0.5">Playlist: {s.playlist_name}</div>}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Nuevo Evento</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white text-lg">&times;</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Día</label>
                                <select value={form.day} onChange={e => setForm({...form, day:Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 text-slate-200">
                                    {DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Inicio</label>
                                    <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time:e.target.value})} className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase block mb-1">Fin</label>
                                    <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time:e.target.value})} className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Tipo</label>
                                <select value={form.type} onChange={e => setForm({...form, type:e.target.value})} className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200">
                                    {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1">Título (opcional)</label>
                                <input type="text" value={form.title} onChange={e => setForm({...form, title:e.target.value})} className="w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-200" placeholder="Programa matutino"/>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400">Cancelar</button>
                                <button onClick={handleCreate} className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white">Crear</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AudioStationLayout>
    );
}
