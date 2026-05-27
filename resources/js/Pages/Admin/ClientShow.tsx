import { Head, Link, router, usePage } from '@inertiajs/react';
import { User, Mail, Radio, ArrowLeft, Edit2, Trash2, LogIn, Calendar, Activity, ShieldCheck, Music, Video, Terminal } from 'lucide-react';
import AdminLayout from './Layout';

interface StationItem {
    id: number;
    name: string;
    type: 'audio' | 'video';
    status: 'online' | 'offline' | 'restarting' | 'error';
    port: number;
    slug: string;
    frontend: string;
    stream_key: string;
}

interface ClientData {
    id: number;
    name: string;
    email: string;
    stations_count: number;
    created_at: string;
    stations: StationItem[];
}

interface PageProps {
    client: ClientData;
    flash: {
        success?: string;
        error?: string;
    };
}

export default function ClientShow() {
    const { client, flash } = usePage<any>().props as PageProps;

    const handleImpersonate = () => {
        if (confirm(`¿Iniciar sesión como el cliente ${client.name}?`)) {
            router.post(`/admin/clients/${client.id}/impersonate`);
        }
    };

    const handleDelete = () => {
        if (confirm(`¿Está seguro de eliminar al cliente ${client.name}? Esta acción también eliminará permanentemente todas sus estaciones de radio y canales de video, así como sus datos asociados.`)) {
            router.delete(`/admin/clients/${client.id}`);
        }
    };

    const audioStations = client.stations.filter(s => s.type === 'audio');
    const videoStations = client.stations.filter(s => s.type === 'video');

    return (
        <AdminLayout currentPage="clients">
            <Head title={`Cliente ${client.name} - Admin TuiStream`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/admin/clients"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al listado de clientes
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/admin/clients/${client.id}/edit`}
                        className="px-3.5 py-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Editar Datos
                    </Link>

                    <button
                        onClick={handleImpersonate}
                        className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                        <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión Como
                    </button>

                    <button
                        onClick={handleDelete}
                        className="px-3.5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar Cliente
                    </button>
                </div>
            </div>

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> {flash.error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Card Left */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center text-center space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
                        
                        <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                            {client.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight truncate max-w-[220px]">{client.name}</h2>
                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[220px]">{client.email}</p>
                        </div>

                        <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> Cliente Certificado
                        </span>

                        <div className="w-full pt-4 border-t border-slate-900/60 text-left space-y-3.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                                    <Calendar className="w-3.5 h-3.5 text-slate-600" /> Creado el
                                </span>
                                <span className="text-slate-300 font-mono">{client.created_at}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 flex items-center gap-1.5 font-semibold">
                                    <Activity className="w-3.5 h-3.5 text-indigo-400" /> Total Servicios
                                </span>
                                <span className="text-slate-300 font-bold font-mono">{client.stations_count}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stations List Right */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Audio Stations */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
                        
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Music className="w-4 h-4 text-indigo-400 animate-pulse" /> Emisoras de Radio ({audioStations.length})
                        </h3>

                        {audioStations.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-900/50">
                                <Music className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                                <p className="text-xs text-slate-500 font-semibold">No tiene emisoras de radio contratadas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {audioStations.map((s) => (
                                    <div key={s.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-900/60 flex flex-col justify-between hover:border-slate-800 transition-all">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-slate-200 text-sm truncate max-w-[180px]">{s.name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                                    s.status === 'online'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-[10px] text-slate-500 font-mono">
                                                <p><span className="text-slate-600 font-sans">Puerto:</span> {s.port}</p>
                                                <p><span className="text-slate-600 font-sans">Frontend:</span> {s.frontend?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                                            <Link
                                                href={`/dashboard/station/${s.id}`}
                                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                                            >
                                                Ver Detalles Emisora &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Stations */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-pink-500/20 to-transparent" />

                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Video className="w-4 h-4 text-pink-400 animate-pulse" /> Canales de Televisión ({videoStations.length})
                        </h3>

                        {videoStations.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-900/50">
                                <Video className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                                <p className="text-xs text-slate-500 font-semibold">No tiene canales de televisión contratados</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {videoStations.map((s) => (
                                    <div key={s.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-900/60 flex flex-col justify-between hover:border-slate-800 transition-all">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h4 className="font-bold text-slate-200 text-sm truncate max-w-[180px]">{s.name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                                    s.status === 'online'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-[10px] text-slate-500 font-mono">
                                                <p><span className="text-slate-600 font-sans">Puerto Ingesta:</span> {s.port}</p>
                                                <p><span className="text-slate-600 font-sans">Stream Key:</span> <span className="text-pink-400">{s.stream_key}</span></p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end">
                                            <Link
                                                href={`/dashboard/canaltv/${s.id}`}
                                                className="text-[10px] font-bold text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                                            >
                                                Ver Detalles Canal &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
