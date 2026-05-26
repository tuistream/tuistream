import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Radio, Layers, Server, Plus, Trash2, Loader2, LogOut, Check, Mail, Video, Music } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';

interface StationItem {
    id: number;
    name: string;
    slug: string;
    port: number;
    status: 'online' | 'offline' | 'restarting' | 'error';
    bitrate: number;
    type: 'audio' | 'video';
    frontend: 'icecast' | 'shoutcast' | 'none';
    client_name: string;
    client_email: string;
}

interface StatsProps {
    total_stations: number;
    online_stations: number;
    total_clients: number;
    system_cpu: number;
    system_ram: number;
}

interface PageProps {
    stations: StationItem[];
    stats: StatsProps;
    flash: {
        success?: string;
        error?: string;
    };
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        } | null;
    };
}

export default function AdminDashboard() {
    const { stations, stats, flash, auth } = usePage<any>().props as PageProps;
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Formulario para aprovisionar
    const { data, setData, post, processing, reset, errors } = useForm({
        client_name: '',
        client_email: '',
        station_name: '',
        port: 8010,
        bitrate: 192,
        max_listeners: 100,
        type: 'audio',
        frontend: 'icecast',
    });

    // Ajustar frontend predeterminado cuando cambia el tipo
    useEffect(() => {
        if (data.type === 'video') {
            setData('frontend', 'none');
        } else if (data.type === 'audio' && data.frontend === 'none') {
            setData('frontend', 'icecast');
        }
    }, [data.type]);

    const handleCreateStation = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/station/create', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleDeleteStation = (id: number, name: string) => {
        if (confirm(`¿Estás completamente seguro de que deseas eliminar la emisora "${name}"? Esta acción apagará sus contenedores Docker y borrará todos sus archivos permanentemente.`)) {
            router.delete(`/admin/station/${id}`);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 overflow-x-hidden relative">
            <Head title="Admin Dashboard - TuiStream" />

            {/* Glowing background highlights */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg text-white">
                            <Radio className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-tight text-white flex items-center gap-2">
                            TuiStream <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">Admin</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-400">Super Administrador</p>
                            <p className="text-sm font-bold text-slate-200">{auth.user?.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                            title="Cerrar Sesión"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Global Stats Grid */}
            <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
                
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        {flash.error}
                    </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Canales</span>
                        <span className="text-3xl font-extrabold font-mono text-white">{stats.total_stations}</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Canales Online</span>
                        <span className="text-3xl font-extrabold font-mono text-emerald-400">{stats.online_stations}</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Clientes Activos</span>
                        <span className="text-3xl font-extrabold font-mono text-indigo-400">{stats.total_clients}</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm flex flex-col gap-2 col-span-2 sm:col-span-1">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                            CPU Host <Server className="w-4 h-4 text-slate-650" />
                        </span>
                        <span className="text-3xl font-extrabold font-mono text-white">{stats.system_cpu}%</span>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm flex flex-col gap-2 col-span-2 sm:col-span-1">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                            RAM Host <Layers className="w-4 h-4 text-slate-650" />
                        </span>
                        <span className="text-3xl font-extrabold font-mono text-white">{stats.system_ram}%</span>
                    </div>

                </div>

                {/* Stations Management Section */}
                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Listado de Canales Aprovisionados</h2>
                            <p className="text-xs text-slate-500 mt-1">Orquesta y monitorea audio (Icecast/SHOUTcast) y video (RTMP/HLS) en directo</p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center gap-1.5 transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" /> Aprovisionar Canal
                        </button>
                    </div>

                    {/* Table / List */}
                    {stations.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl">
                            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">No hay ninguna emisora o canal registrado todavía.</p>
                            <p className="text-xs text-slate-500 mt-1">Haz clic en el botón de arriba para crear tu primer contenedor.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-850">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/70 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                        <th className="p-4">Canal / Emisora</th>
                                        <th className="p-4">Tipo / Servidor</th>
                                        <th className="p-4">Puerto / Calidad</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Estado Docker</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/50">
                                    {stations.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                            <td className="p-4 font-bold text-slate-200">
                                                {s.name}
                                                <span className="block text-xs font-mono font-normal text-slate-500 mt-0.5">/{s.slug}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-350">
                                                    {s.type === 'video' ? (
                                                        <>
                                                            <Video className="w-3.5 h-3.5 text-pink-400" /> Video (RTMP/HLS)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Music className="w-3.5 h-3.5 text-indigo-400" /> Audio ({s.frontend.toUpperCase()})
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs">
                                                Puerto: <span className="text-slate-300 font-bold">{s.port}</span>
                                                <span className="block text-slate-500 mt-0.5">
                                                    {s.type === 'video' ? 'Calidad 1080p' : `${s.bitrate} kbps | MP3`}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-350">{s.client_name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3" /> {s.client_email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                    s.status === 'online' 
                                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                                        : s.status === 'offline'
                                                            ? 'bg-slate-950 border border-slate-900 text-slate-500'
                                                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteStation(s.id, s.name)}
                                                    className="p-2 bg-red-500/10 border border-red-500/20 text-red-450 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                    title="Eliminar Estación"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

            </main>

            {/* Modal Dialog: Provisioning Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
                        
                        <h3 className="text-lg font-bold text-white mb-2">Aprovisionar Nuevo Canal o Emisora</h3>
                        <p className="text-xs text-slate-500 mb-6">
                            Esto creará el cliente e iniciará los contenedores de streaming aislados (Icecast/SHOUTcast/RTMP) correspondientes.
                        </p>

                        <form onSubmit={handleCreateStation} className="space-y-4">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nombre del Cliente</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.client_name}
                                        onChange={e => setData('client_name', e.target.value)}
                                        placeholder="Juan Pérez"
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Correo del Cliente</label>
                                    <input
                                        type="email"
                                        required
                                        value={data.client_email}
                                        onChange={e => setData('client_email', e.target.value)}
                                        placeholder="juan@ejemplo.com"
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nombre de la Emisora / Canal</label>
                                <input
                                    type="text"
                                    required
                                    value={data.station_name}
                                    onChange={e => setData('station_name', e.target.value)}
                                    placeholder="Radio Latino Mix"
                                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Contenido</label>
                                    <select
                                        value={data.type}
                                        onChange={e => setData('type', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                                    >
                                        <option value="audio">Audio (Radio FM)</option>
                                        <option value="video">Video (IPTV / Live Stream)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Servidor de Salida (Frontend)</label>
                                    <select
                                        value={data.frontend}
                                        disabled={data.type === 'video'}
                                        onChange={e => setData('frontend', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
                                    >
                                        {data.type === 'video' ? (
                                            <option value="none">Nginx RTMP HLS</option>
                                        ) : (
                                            <>
                                                <option value="icecast">Icecast Server</option>
                                                <option value="shoutcast">SHOUTcast Server</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Puerto del Host</label>
                                    <input
                                        type="number"
                                        required
                                        value={data.port}
                                        onChange={e => setData('port', parseInt(e.target.value))}
                                        placeholder="8010"
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all font-mono"
                                    />
                                    {errors.port && <p className="text-[10px] text-red-400 mt-1">{errors.port}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Bitrate Audio</label>
                                    <select
                                        value={data.bitrate}
                                        disabled={data.type === 'video'}
                                        onChange={e => setData('bitrate', parseInt(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all disabled:opacity-40"
                                    >
                                        <option value={64}>64 kbps (Bajo)</option>
                                        <option value={128}>128 kbps (Normal)</option>
                                        <option value={192}>192 kbps (HQ)</option>
                                        <option value={320}>320 kbps (Studio)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Límite Oyentes</label>
                                    <input
                                        type="number"
                                        required
                                        value={data.max_listeners}
                                        onChange={e => setData('max_listeners', parseInt(e.target.value))}
                                        placeholder="100"
                                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-450 hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Creando...
                                        </>
                                    ) : (
                                        'Generar Emisora'
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
