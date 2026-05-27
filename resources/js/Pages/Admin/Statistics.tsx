import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    BarChart3, Activity, Radio, Music, Video, Users, Zap,
    TrendingUp, BarChart, PieChart, Monitor
} from 'lucide-react';
import AdminLayout from './Layout';
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';

interface SummaryProps {
    total_stations: number;
    audio_stations: number;
    video_stations: number;
    online_stations: number;
    offline_stations: number;
    error_stations: number;
    total_clients: number;
    total_listeners: number;
    avg_bitrate: number;
}

interface StatusItem {
    name: string;
    value: number;
    color: string;
}

interface FrontendItem {
    name: string;
    value: number;
}

interface TopClient {
    id: number;
    name: string;
    email: string;
    stations_count: number;
}

interface MonthlyItem {
    month: string;
    audio: number;
    video: number;
}

interface StationDetail {
    id: number;
    name: string;
    type: 'audio' | 'video';
    status: string;
    frontend: string;
    port: number;
    bitrate: number;
    max_listeners: number;
    client_name: string;
    created_at: string;
}

interface PageProps {
    summary: SummaryProps;
    by_status: StatusItem[];
    by_frontend: FrontendItem[];
    top_clients: TopClient[];
    monthly_creation: MonthlyItem[];
    stations_detail: StationDetail[];
}

const COLORS_STATUS = ['#34d399', '#64748b', '#f87171'];
const COLORS_FRONTEND = ['#818cf8', '#f472b6'];

// A robust Error Boundary component to prevent Recharts/Context failures from crashing the entire panel
interface ErrorBoundaryProps {
    children: ReactNode;
    title: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class SafeChartBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Recharts rendering error caught by boundary:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 rounded-xl border border-slate-900/60 p-4 text-center select-none">
                    <BarChart3 className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {this.props.title}
                    </span>
                    <span className="text-[10px] text-slate-500 max-w-[200px]">
                        Gráfico no disponible. Transmisiones en vivo activas.
                    </span>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function Statistics() {
    const props = usePage<any>().props as PageProps;

    // Destructuración ultra segura con fallbacks preventivos
    const summary = props.summary || {
        total_stations: 0,
        audio_stations: 0,
        video_stations: 0,
        online_stations: 0,
        offline_stations: 0,
        error_stations: 0,
        total_clients: 0,
        total_listeners: 0,
        avg_bitrate: 0,
    };
    const by_status = props.by_status || [];
    const by_frontend = props.by_frontend || [];
    const top_clients = props.top_clients || [];
    const monthly_creation = props.monthly_creation || [];
    const stations_detail = props.stations_detail || [];

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const statCards = [
        { label: 'Total Estaciones', value: summary.total_stations, icon: Radio, color: 'text-white', bg: 'from-indigo-500/20 to-violet-500/10', border: 'border-indigo-500/20' },
        { label: 'Radios (Audio)', value: summary.audio_stations, icon: Music, color: 'text-indigo-400', bg: 'from-indigo-500/10 to-transparent', border: 'border-indigo-500/15' },
        { label: 'Canales (Video)', value: summary.video_stations, icon: Video, color: 'text-pink-400', bg: 'from-pink-500/10 to-transparent', border: 'border-pink-500/15' },
        { label: 'Online', value: summary.online_stations, icon: Zap, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/15' },
        { label: 'Clientes', value: summary.total_clients, icon: Users, color: 'text-amber-400', bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/15' },
        { label: 'Capacidad Oyentes', value: summary.total_listeners, icon: Activity, color: 'text-violet-400', bg: 'from-violet-500/10 to-transparent', border: 'border-violet-500/15' },
    ];

    return (
        <AdminLayout currentPage="statistics">
            <Head title="Estadísticas - Admin TuiStream" />

            <div className="mb-8 select-none">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    Estadísticas del Servidor
                </h1>
                <p className="text-sm text-slate-500 mt-1">Métricas en tiempo real y distribución del sistema standalone TuiStream</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={`p-5 rounded-2xl border ${card.border} bg-linear-to-br ${card.bg} backdrop-blur-sm flex flex-col gap-3 transition-all hover:scale-[1.02] select-none`}>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.label}</span>
                                <Icon className={`w-4.5 h-4.5 ${card.color} opacity-60`} />
                            </div>
                            <span className={`text-3xl font-extrabold font-mono ${card.color}`}>{card.value}</span>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Monthly Creation */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-4 select-none">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-200">Creación Mensual de Estaciones</h2>
                    </div>
                    <div className="h-64">
                        <SafeChartBoundary title="Creación Mensual">
                            {mounted && monthly_creation.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={monthly_creation}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="month" stroke="#475569" fontSize={12} />
                                        <YAxis stroke="#475569" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="audio" name="Audio" fill="#818cf8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="video" name="Video" fill="#f472b6" radius={[4, 4, 0, 0]} />
                                    </ReBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-950/20 rounded-xl border border-slate-900/50 select-none">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {mounted ? "No hay datos de creación mensual" : "Cargando gráfico..."}
                                    </span>
                                </div>
                            )}
                        </SafeChartBoundary>
                    </div>
                </div>

                {/* Status Pie */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-4 select-none">
                        <PieChart className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-200">Estado de Estaciones</h2>
                    </div>
                    <div className="h-48">
                        <SafeChartBoundary title="Estado General">
                            {mounted && by_status.some(item => item.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={by_status} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                                            {by_status.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
                                        <Legend />
                                    </RePieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-950/20 rounded-xl border border-slate-900/50 select-none">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {mounted ? "No hay estaciones en línea" : "Cargando gráfico..."}
                                    </span>
                                </div>
                            )}
                        </SafeChartBoundary>
                    </div>
                </div>
            </div>

            {/* Frontend Distribution + Top Clients */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-5">
                    <div className="flex items-center gap-2 mb-4 select-none">
                        <BarChart className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-200">Distribución por Frontend (Audio)</h2>
                    </div>
                    <div className="h-48">
                        <SafeChartBoundary title="Distribución Audio">
                            {mounted && by_frontend.some(item => item.value > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReBarChart data={by_frontend} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis type="number" stroke="#475569" fontSize={12} />
                                        <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0' }} />
                                        <Bar dataKey="value" name="Estaciones" fill="#818cf8" radius={[0, 4, 4, 0]}>
                                            {by_frontend.map((_, index) => (
                                                <Cell key={`cell-f-${index}`} fill={COLORS_FRONTEND[index % COLORS_FRONTEND.length]} />
                                            ))}
                                        </Bar>
                                    </ReBarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-950/20 rounded-xl border border-slate-900/50 select-none">
                                    <span className="text-xs text-slate-500 font-medium">
                                        {mounted ? "No hay distribución por frontend" : "Cargando gráfico..."}
                                    </span>
                                </div>
                            )}
                        </SafeChartBoundary>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-900 flex items-center gap-2 select-none">
                        <Users className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-bold text-slate-200">Top Clientes</h2>
                    </div>
                    {top_clients.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm select-none">No hay clientes registrados.</div>
                    ) : (
                        <div className="divide-y divide-slate-900/50">
                            {top_clients.map((c) => (
                                <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-900/30 transition-all select-none">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{c.name}</p>
                                            <p className="text-xs text-slate-500">{c.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-lg">
                                        {c.stations_count} est.
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Stations Detail Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                <div className="p-5 border-b border-slate-900 flex items-center gap-2 select-none">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-slate-200">Detalle de Estaciones</h2>
                </div>
                {stations_detail.length === 0 ? (
                    <div className="p-12 text-center select-none">
                        <Radio className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay estaciones registradas aún.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
                                    <th className="p-4">Estación</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Puerto</th>
                                    <th className="p-4">Bitrate</th>
                                    <th className="p-4">Capacidad</th>
                                    <th className="p-4">Cliente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {stations_detail.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-900/30 transition-all text-sm select-none">
                                        <td className="p-4 font-bold text-slate-200">{s.name}</td>
                                        <td className="p-4">
                                            <span className={`text-xs font-semibold ${s.type === 'video' ? 'text-pink-400' : 'text-indigo-400'}`}>
                                                {s.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                s.status === 'online'
                                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                    : s.status === 'error'
                                                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                                        : 'bg-slate-950 border border-slate-900 text-slate-500'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-300">{s.port}</td>
                                        <td className="p-4 font-mono text-xs text-slate-300">{s.bitrate > 0 ? `${s.bitrate} kbps` : 'N/A'}</td>
                                        <td className="p-4 text-xs text-slate-300">{s.max_listeners}</td>
                                        <td className="p-4 text-xs text-slate-400">{s.client_name}</td>
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
