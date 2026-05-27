import { Head, Link, usePage } from '@inertiajs/react';
import { Music, Video, Users, Activity, Radio, ArrowRight, Zap, Server, Cpu, Database, HardDrive, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from './Layout';

interface StatsProps {
    total_stations: number;
    audio_stations: number;
    video_stations: number;
    online_stations: number;
    total_clients: number;
    total_listeners: number;
}

interface RecentStation {
    id: number;
    name: string;
    type: 'audio' | 'video';
    status: string;
    client_name: string;
    created_at: string;
}

interface SystemMetrics {
    cpu: number;
    ram_used: number;
    ram_total: number;
    disk_used: number;
    disk_total: number;
}

interface PageProps {
    stats: StatsProps;
    recent_stations: RecentStation[];
    system_metrics?: SystemMetrics;
    flash: {
        success?: string;
        error?: string;
    };
}

interface DiagnosticsMap {
    [key: string]: {
        name: string;
        installed: boolean;
        version: string;
        description: string;
    };
}

export default function AdminDashboard() {
    const { stats, recent_stations, system_metrics, flash } = usePage<any>().props as PageProps;

    const metrics = system_metrics || {
        cpu: 8.5,
        ram_used: 4.12,
        ram_total: 16.0,
        disk_used: 142.8,
        disk_total: 500.0,
    };

    const [liveMetrics, setLiveMetrics] = useState(metrics);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsMap>({});

    useEffect(() => {
        let mounted = true;
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/admin/system-metrics', {
                    headers: { 'X-Inertia': 'true', 'Accept': 'application/json' }
                });
                if (res.ok && mounted) {
                    const data = await res.json();
                    setLiveMetrics(data);
                }
            } catch {
                // mantener métricas actuales si falla
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 8000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    useEffect(() => {
        let mounted = true;
        const fetchDiagnostics = async () => {
            try {
                const res = await fetch('/admin/diagnostics', {
                    headers: { 'X-Inertia': 'true', 'Accept': 'application/json' }
                });
                if (res.ok && mounted) {
                    const data = await res.json();
                    setDiagnostics(data);
                }
            } catch {
                // mantener vacío si falla
            }
        };
        fetchDiagnostics();
        return () => { mounted = false; };
    }, []);

    const statCards = [
        {
            label: 'Total Estaciones',
            value: stats.total_stations,
            icon: Radio,
            color: 'text-white',
            bg: 'from-indigo-500/20 to-violet-500/10',
            border: 'border-indigo-500/20',
        },
        {
            label: 'Radios (Audio)',
            value: stats.audio_stations,
            icon: Music,
            color: 'text-indigo-400',
            bg: 'from-indigo-500/10 to-transparent',
            border: 'border-indigo-500/15',
        },
        {
            label: 'Canales (Video)',
            value: stats.video_stations,
            icon: Video,
            color: 'text-pink-400',
            bg: 'from-pink-500/10 to-transparent',
            border: 'border-pink-500/15',
        },
        {
            label: 'Estaciones Online',
            value: stats.online_stations,
            icon: Zap,
            color: 'text-emerald-400',
            bg: 'from-emerald-500/10 to-transparent',
            border: 'border-emerald-500/15',
        },
        {
            label: 'Clientes Activos',
            value: stats.total_clients,
            icon: Users,
            color: 'text-amber-400',
            bg: 'from-amber-500/10 to-transparent',
            border: 'border-amber-500/15',
        },
        {
            label: 'Oyentes Totales',
            value: stats.total_listeners,
            icon: Activity,
            color: 'text-violet-400',
            bg: 'from-violet-500/10 to-transparent',
            border: 'border-violet-500/15',
        },
    ];

    return (
        <AdminLayout currentPage="dashboard">
            <Head title="Dashboard - Admin TuiStream" />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {flash.success}
                </div>
            )}

            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard General</h1>
                <p className="text-sm text-slate-500 mt-1">Resumen global del sistema TuiStream</p>
            </div>

            {/* Realtime Server Monitor */}
            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md mb-8">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-900/60">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            Monitor de Rendimiento del Servidor (Tiempo Real)
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">Diagnósticos activos del nodo standalone central</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono font-bold text-indigo-400 uppercase select-none">
                        Nodo Activo
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* CPU Card */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <span>Uso de CPU</span>
                            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 select-none">
                            <span className="text-2xl font-black font-mono text-white">{liveMetrics.cpu}%</span>
                            <span className="text-[9px] text-indigo-400 font-bold uppercase font-mono">Load</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                                style={{ width: `${liveMetrics.cpu}%` }} 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                            />
                        </div>
                    </div>

                    {/* RAM Card */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <span>Memoria RAM</span>
                            <Database className="w-4 h-4 text-violet-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 select-none">
                            <span className="text-2xl font-black font-mono text-white">{liveMetrics.ram_used} GB</span>
                            <span className="text-[9px] text-slate-500 font-mono">/ {liveMetrics.ram_total} GB</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                                style={{ width: `${(liveMetrics.ram_used / liveMetrics.ram_total) * 100}%` }} 
                                className="bg-violet-500 h-full rounded-full transition-all duration-1000" 
                            />
                        </div>
                    </div>

                    {/* Disk Card */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <span>Almacenamiento</span>
                            <HardDrive className="w-4 h-4 text-pink-400 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 select-none">
                            <span className="text-2xl font-black font-mono text-white">{liveMetrics.disk_used} GB</span>
                            <span className="text-[9px] text-slate-500 font-mono">/ {liveMetrics.disk_total} GB</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                                style={{ width: `${(liveMetrics.disk_used / liveMetrics.disk_total) * 100}%` }} 
                                className="bg-pink-500 h-full rounded-full" 
                            />
                        </div>
                    </div>

                    {/* Connections Card */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            <span>Conexiones Activas</span>
                            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 select-none">
                            <span className="text-2xl font-black font-mono text-white">{liveMetrics.listeners || stats.total_listeners || 0}</span>
                            <span className="text-[9px] text-emerald-400 font-bold uppercase font-mono">En Línea</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 select-none mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <span className="truncate">Oyentes y streams conectados</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnóstico de Backend de Streaming */}
            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md mb-8">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-900/60">
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
                            <Server className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                            Diagnóstico del Servidor de Streaming (Estado Físico)
                        </h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">Analizar e inspeccionar la instalación de motores de transmisión</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400 uppercase select-none">
                        Inspección Lista
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.keys(diagnostics).length === 0 ? (
                        <div className="lg:col-span-4 text-center py-8 text-slate-500 text-xs select-none">
                            <div className="animate-pulse flex items-center justify-center gap-2">
                                <Server className="w-4 h-4 text-indigo-400" />
                                <span>Cargando diagnóstico de servicios...</span>
                            </div>
                        </div>
                    ) : (
                        Object.entries(diagnostics).map(([key, service]: [string, any]) => (
                        <div key={key} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col justify-between gap-3 relative overflow-hidden group">
                            {/* Glass background shine */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
                            
                            <div className="flex items-start justify-between gap-2 z-10">
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white tracking-wide truncate">{service.name}</h4>
                                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5 truncate">{service.version}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono shrink-0 select-none ${
                                    service.installed 
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                }`}>
                                    {service.installed ? 'Instalado' : 'No Encontrado'}
                                </span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-normal z-10 mt-1">{service.description}</p>
                        </div>
                    ))
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className={`p-5 rounded-2xl border ${card.border} bg-gradient-to-br ${card.bg} backdrop-blur-sm flex flex-col gap-3 transition-all hover:scale-[1.02]`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.label}</span>
                                <Icon className={`w-4.5 h-4.5 ${card.color} opacity-60`} />
                            </div>
                            <span className={`text-3xl font-extrabold font-mono ${card.color}`}>{card.value}</span>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link
                    href="/admin/audio"
                    className="group p-6 rounded-2xl border border-slate-900 bg-slate-900/20 hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Music className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-200">Audio Streaming</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Gestionar radios Icecast / SHOUTcast</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                    href="/admin/video"
                    className="group p-6 rounded-2xl border border-slate-900 bg-slate-900/20 hover:bg-pink-500/5 hover:border-pink-500/20 transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                            <Video className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-200">Video Streaming</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Gestionar canales RTMP / HLS en directo</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>

            {/* Recent Stations */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                <div className="p-5 border-b border-slate-900 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-200">Estaciones Recientes</h2>
                    <Server className="w-4 h-4 text-slate-600" />
                </div>

                {recent_stations.length === 0 ? (
                    <div className="p-12 text-center">
                        <Radio className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay estaciones registradas aún.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-900/50">
                        {recent_stations.map((s) => (
                            <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-900/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${s.type === 'video' ? 'bg-pink-500/10 text-pink-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                        {s.type === 'video' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">{s.name}</p>
                                        <p className="text-xs text-slate-500">{s.client_name} · {s.created_at}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    s.status === 'online'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-950 border border-slate-900 text-slate-500'
                                }`}>
                                    {s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
