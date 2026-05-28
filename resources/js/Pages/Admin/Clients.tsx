import { Head, Link, router, usePage } from '@inertiajs/react';
import { Users, Mail, Radio, Eye, LogIn, Music, Video, UserPlus, Edit2, Trash2 } from 'lucide-react';
import AdminLayout from './Layout';

interface StationItem {
    id: number;
    name: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
    slug: string;
    frontend: string;
    stream_key: string;
}

interface ClientItem {
    id: number;
    name: string;
    email: string;
    stations_count: number;
    created_at: string;
    stations: StationItem[];
}

interface PageProps {
    clients: ClientItem[];
    flash: {
        success?: string;
        error?: string;
    };
}

export default function Clients() {
    const { clients, flash } = usePage<any>().props as PageProps;

    const handleImpersonate = (clientId: number, clientName: string) => {
        if (confirm(`¿Iniciar sesión como el cliente ${clientName}?`)) {
            router.post(`/admin/clients/${clientId}/impersonate`);
        }
    };

    const handleDelete = (clientId: number, clientName: string) => {
        if (confirm(`¿Está seguro de eliminar al cliente ${clientName}? Esta acción también eliminará permanentemente todas sus estaciones de radio y canales de video, así como sus datos asociados.`)) {
            router.delete(`/admin/clients/${clientId}`);
        }
    };

    return (
        <AdminLayout currentPage="clients">
            <Head title="Clientes - Admin TuiStream" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                        Clientes
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Listado de clientes registrados en el sistema</p>
                </div>

                <Link
                    href="/admin/clients/create"
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                >
                    <UserPlus className="w-4 h-4" /> Crear Cliente
                </Link>
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

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                {clients.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-400 font-semibold text-base">No hay clientes registrados</p>
                        <p className="text-xs text-slate-500 mt-1">Haga clic en "Crear Cliente" para registrar una nueva cuenta de cliente.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Correo</th>
                                    <th className="p-4">Estaciones</th>
                                    <th className="p-4">Registro</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {clients.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                        <td className="p-4">
                                            <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 group">
                                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold group-hover:scale-105 transition-transform">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{c.name}</span>
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> {c.email}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {c.stations && c.stations.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {c.stations.map((s: any) => (
                                                        <Link key={s.id} href={`/dashboard/station/${s.id}`}
                                                            className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all">
                                                            {s.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-xs">Sin estaciones</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-slate-500">{c.created_at}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/clients/${c.id}`}
                                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1 transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                </Link>
                                                <Link
                                                    href={`/admin/clients/${c.id}/edit`}
                                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-300 flex items-center gap-1 transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleImpersonate(c.id, c.name)}
                                                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-all"
                                                >
                                                    <LogIn className="w-3.5 h-3.5" /> Iniciar como
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c.id, c.name)}
                                                    className="p-1.5 text-xs font-semibold rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center gap-1 transition-all"
                                                    title="Eliminar Cliente"
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
