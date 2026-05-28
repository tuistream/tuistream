import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Video, Plus, Trash2, Loader2, Check, Mail, Cast, Eye, Settings, Power, RefreshCw, Edit2 } from 'lucide-react';
import AdminLayout from './Layout';

interface StationItem {
    id: number;
    name: string;
    slug: string;
    port: number;
    status: 'online' | 'offline' | 'restarting' | 'error';
    stream_key: string;
    max_listeners: number;
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

export default function VideoStations() {
    const { stations, flash } = usePage<any>().props as any;

    const handleToggle = (id: number) => {
        router.post(`/dashboard/canaltv/${id}/toggle`);
    };

    const handleRestart = (id: number) => {
        if (confirm('¿Reiniciar los servicios de streaming de video de esta estación?')) {
            router.post(`/dashboard/canaltv/${id}/restart`);
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar el canal de video "${name}"? Se detendrán y eliminarán sus contenedores Docker.`)) {
            router.delete(`/admin/station/${id}`);
        }
    };

    return (
        <AdminLayout currentPage="video">
            <Head title="Video Streaming - Admin TuiStream" />

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
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                            <Video className="w-5 h-5" />
                        </div>
                        Video Streaming
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Gestionar canales IPTV / Live Stream (RTMP → HLS)</p>
                </div>
                <Link
                    href="/admin/video/create-form"
                    className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-pink-500/10 flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" /> Nuevo Canal
                </Link>
            </div>

            {/* Stations Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                {stations.length === 0 ? (
                    <div className="text-center py-16">
                        <Video className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-base">No hay canales de video registrados</p>
                        <p className="text-xs text-slate-500 mt-1">Crea tu primer canal RTMP/HLS con el botón de arriba.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Canal</th>
                                    <th className="p-4">Protocolo</th>
                                    <th className="p-4">Puerto / Stream Key</th>
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
                                            <Link href={`/dashboard/station/${s.id}`} className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">{s.name}</Link>
                                            <p className="text-xs font-mono text-slate-500 mt-0.5">/{s.slug}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                                                <Cast className="w-3.5 h-3.5 text-pink-400" />
                                                RTMP → HLS
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            <span className="text-slate-300 font-bold">:{s.port}</span>
                                            <span className="block text-pink-400/80 mt-0.5">key: {s.stream_key}</span>
                                        </td>
                                        <td className="p-4">
                                            <Link href={`/admin/clients/${s.client_id}`} className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors text-sm">{s.client_name || '—'}</Link>
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
                                                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
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

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link
                                                    href={`/dashboard/canaltv/${s.id}`}
                                                    className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-all"
                                                    title="Overview (Ficha General)"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/canaltv/${s.id}/config`}
                                                    className="p-2 bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-400 rounded-lg transition-all"
                                                    title="Configurar Parámetros"
                                                >
                                                    <Settings className="w-3.5 h-3.5" />
                                                </Link>
                                                <Link
                                                    href={`/admin/video/${s.id}/edit`}
                                                    className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-all"
                                                    title="Editar Canal"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(s.id, s.name)}
                                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Eliminar Canal"
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
