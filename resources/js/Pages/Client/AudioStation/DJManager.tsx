import { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Users, Plus, Key, ToggleLeft, Trash2, Edit, X, Check, Save } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface DjData {
    id: number;
    name: string;
    username: string;
    password?: string;
    is_active: boolean;
    streams_count: number;
    created_at: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationDJManager() {
    const { station } = usePage<any>().props as PageProps;
    const [djs, setDjs] = useState<DjData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', username: '', password: '' });
    const [editForm, setEditForm] = useState({ name: '', username: '', password: '' });

    const apiBase = `/dashboard/station/${station.id}/djs`;

    const fetchDjs = useCallback(async () => {
        try {
            const res = await fetch(`${apiBase}/list`, {
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setDjs(data);
            }
        } catch { /* keep current list */ }
        setLoading(false);
    }, [apiBase]);

    useEffect(() => {
        fetchDjs();
    }, [fetchDjs]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${apiBase}/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setShowCreate(false);
                setForm({ name: '', username: '', password: '' });
                fetchDjs();
            } else {
                const err = await res.json();
                alert(err.message || Object.values(err.errors || {}).flat().join('\n'));
            }
        } catch { /* handle error */ }
    };

    const handleEdit = (dj: DjData) => {
        setEditingId(dj.id);
        setEditForm({ name: dj.name, username: dj.username, password: '' });
    };

    const handleUpdate = async (djId: number) => {
        const payload: Record<string, string> = { name: editForm.name, username: editForm.username };
        if (editForm.password) payload.password = editForm.password;

        try {
            const res = await fetch(`${apiBase}/${djId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setEditingId(null);
                setEditForm({ name: '', username: '', password: '' });
                fetchDjs();
            }
        } catch { /* handle error */ }
    };

    const handleDelete = async (dj: DjData) => {
        if (!confirm(`¿Eliminar a ${dj.name} permanentemente?`)) return;
        try {
            await fetch(`${apiBase}/${dj.id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            });
            fetchDjs();
        } catch { /* handle error */ }
    };

    const handleToggle = async (dj: DjData) => {
        try {
            await fetch(`${apiBase}/${dj.id}/toggle`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            });
            fetchDjs();
        } catch { /* handle error */ }
    };

    return (
        <AudioStationLayout currentSection="djs">
            <Head title={`${station.name} - Gerente de DJ`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Users className="w-4 h-4" />
                        </div>
                        Gerente de DJ
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Cree y gestione cuentas para locutores y DJs en vivo</p>
                </div>

                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Agregar DJ Locutor
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                            <h3 className="text-sm font-bold text-white">Nuevo DJ Locutor</h3>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Nombre Completo</label>
                                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Usuario de Ingesta</label>
                                <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Contraseña</label>
                                <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancelar</button>
                                <button type="submit"
                                    className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                                    <Save className="w-3.5 h-3.5" /> Crear DJ
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
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Usuario Ingesta</th>
                                <th className="p-4">Transmisiones</th>
                                <th className="p-4">Acceso</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-xs">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando DJs...</td></tr>
                            ) : djs.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay DJs registrados. ¡Agregue uno!</td></tr>
                            ) : (
                                djs.map((dj) => (
                                    <tr key={dj.id} className="hover:bg-slate-900/30 transition-all">
                                        <td className="p-4">
                                            {editingId === dj.id ? (
                                                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white" />
                                            ) : (
                                                <span className="font-bold text-slate-200">{dj.name}</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {editingId === dj.id ? (
                                                <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-indigo-400 font-mono" />
                                            ) : (
                                                <span className="font-mono text-indigo-400">{dj.username}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-slate-300">{dj.streams_count} veces</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggle(dj)}
                                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
                                                    dj.is_active
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                                }`}
                                            >
                                                {dj.is_active ? 'Habilitado' : 'Deshabilitado'}
                                            </button>
                                        </td>
                                        <td className="p-4 flex gap-1">
                                            {editingId === dj.id ? (
                                                <>
                                                    <button onClick={() => handleUpdate(dj.id)}
                                                        className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg transition-all" title="Guardar">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)}
                                                        className="p-2 hover:bg-slate-900 text-slate-400 rounded-lg transition-all" title="Cancelar">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(dj)}
                                                        className="p-2 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-all">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(dj)}
                                                        className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
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
