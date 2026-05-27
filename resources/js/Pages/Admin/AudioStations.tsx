import { Head, router, usePage, Link } from '@inertiajs/react';
import { Music, Plus, Trash2, Check, Mail, Eye, Settings, Power, RefreshCw, Edit2 } from 'lucide-react';
import AdminLayout from './Layout';

interface StationItem {
    id: number;
    name: string;
    slug: string;
    port: number;
    status: 'online' | 'offline' | 'restarting' | 'error';
    bitrate: number;
    max_listeners: number;
    frontend: 'icecast' | 'shoutcast';
    client_name: string;
    client_email: string;
    created_at: string;
}

interface PageProps {
    stations: StationItem[];
    flash: {
        success?: string;
        error?: string;
        warning?: string;
    };
}

export default function AudioStations() {
    const { stations, flash } = usePage<any>().props as any;

    const handleToggle = (id: number) => {
        router.post(`/dashboard/station/${id}/toggle`);
    };

    const handleRestart = (id: number) => {
        if (confirm('¿Reiniciar los servicios de streaming de audio de esta estación?')) {
            router.post(`/dashboard/station/${id}/restart`);
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar la radio "${name}"? Se detendrán y eliminarán sus contenedores Docker.`)) {
            router.delete(`/admin/station/${id}`);
        }
    };

    return (
        <AdminLayout currentPage="audio">
            <Head title="Audio Streaming - Admin TuiStream" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> {flash.success}
                </div>
            )}
            {flash?.warning && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> {flash.warning}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> {flash.error}
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Music className="w-5 h-5" />
                        </div>
                        Audio Streaming
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Gestionar estaciones de radio Icecast y SHOUTcast</p>
                </div>
                <Link
                    href="/admin/audio/create-form"
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" /> Nueva Radio
                </Link>
            </div>

            {/* Stations Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                {stations.length === 0 ? (
                    <div className="text-center py-16">
                        <Music className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-base">No hay radios registradas</p>
                        <p className="text-xs text-slate-500 mt-1">Crea tu primera estación de audio con el botón de arriba.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Radio</th>
                                    <th className="p-4">Frontend</th>
                                    <th className="p-4">Puerto / Bitrate</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4 text-center">Controles</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {stations.map((s: StationItem) => (
                                    <tr key={s.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-200">{s.name}</p>
                                            <p className="text-xs font-mono text-slate-500 mt-0.5">/{s.slug}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                                                <Music className="w-3.5 h-3.5 text-indigo-400" />
                                                {s.frontend.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            <span className="text-slate-300 font-bold">:{s.port}</span>
                                            <span className="block text-slate-500 mt-0.5">{s.bitrate} kbps · MP3</span>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-300 text-sm">{s.client_name}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3" /> {s.client_email}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                                s.status === 'online'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : s.status === 'error'
                                                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                                        : 'bg-slate-950 border-slate-900 text-slate-500'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">{s.created_at}</td>
                                        
                                        {/* Dynamic Controls */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleToggle(s.id)}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        s.status === 'online'
                                                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-405 border border-emerald-500/20'
                                                    }`}
                                                    title={s.status === 'online' ? 'Detener Servicio' : 'Iniciar Servicio'}
                                                >
                                                    <Power className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRestart(s.id)}
                                                    disabled={s.status !== 'online'}
                                                    className="p-2 bg-slate-950 border border-slate-900 hover:bg-slate-900 disabled:opacity-40 text-slate-300 rounded-lg transition-all"
                                                    title="Reiniciar Contenedor"
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/dashboard/station/${s.id}`}
                                                    className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-all"
                                                    title="Overview (Ficha General)"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/station/${s.id}/config`}
                                                    className="p-2 bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-400 rounded-lg transition-all"
                                                    title="Configurar Parámetros"
                                                >
                                                    <Settings className="w-3.5 h-3.5" />
                                                </Link>
                                                <Link
                                                    href={`/admin/audio/${s.id}/edit`}
                                                    className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-all"
                                                    title="Editar Estación"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.name)}
                                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Eliminar Estación"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </AdminLayout>
    );
}
