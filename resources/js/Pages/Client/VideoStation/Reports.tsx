import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { BarChart3, Users, Clock, Wifi, Calendar, TrendingUp, Download, ExternalLink } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VideoStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface ReportData {
    total_listeners: number;
    peak_listeners: number;
    avg_session_minutes: number;
    total_bandwidth_gb: number;
    hourly: { time: string; viewers: number }[];
    daily: { name: string; gb: number }[];
    sessions: { name: string; count: number }[];
}

function defaultReportData(): ReportData {
    return {
        total_listeners: 0,
        peak_listeners: 0,
        avg_session_minutes: 0,
        total_bandwidth_gb: 0,
        hourly: [],
        daily: [],
        sessions: [
            { name: '0-5 min', count: 0 },
            { name: '5-15 min', count: 0 },
            { name: '15-30 min', count: 0 },
            { name: '30-60 min', count: 0 },
            { name: '1h+', count: 0 },
        ],
    };
}

export default function VideoStationReports() {
    const { station } = usePage<any>().props as { station: { id: number; name: string; slug: string } };
    const [reportTab, setReportTab] = useState<'summary' | 'sessions' | 'time' | 'traffic'>('summary');
    const [data, setData] = useState<ReportData>(defaultReportData());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/dashboard/canaltv/${station.id}/reports/data`, { headers: apiHeaders() })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setData({ ...defaultReportData(), ...d }))
            .catch(() => setData(defaultReportData()))
            .finally(() => setLoading(false));
    }, [station.id]);

    return (
        <VideoStationLayout currentSection="reports">
            <Head title={`${station.name} - Informes`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        Informes y Estadísticas
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Reportes de espectadores, tráfico y conexiones de {station.name}</p>
                </div>
            </div>

            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl overflow-x-auto">
                {(['summary', 'sessions', 'time', 'traffic'] as const).map(tab => (
                    <button key={tab} onClick={() => setReportTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                            reportTab === tab ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                        }`}>
                        {tab === 'summary' && 'Resumen'}
                        {tab === 'sessions' && 'Sesiones'}
                        {tab === 'time' && 'Por Horario'}
                        {tab === 'traffic' && 'Tráfico'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">
                    <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Cargando estadísticas...
                </div>
            ) : (
                <div className="space-y-6">
                    {reportTab === 'summary' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Espectadores Únicos" value={String(data.total_listeners)} subtitle="Últimos 7 días" icon={Users} color="pink" />
                            <StatCard title="Duración Promedio" value={`${data.avg_session_minutes} min`} subtitle="Por sesión" icon={Clock} color="violet" />
                            <StatCard title="Ancho de Banda" value={`${data.total_bandwidth_gb.toFixed(1)} GB`} subtitle="Consumo mensual" icon={Wifi} color="cyan" />
                        </div>
                    )}

                    {reportTab === 'sessions' && (
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-pink-400" /> Duración de Sesión
                            </h3>
                            <div className="aspect-video w-full max-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.sessions}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                        <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {reportTab === 'time' && (
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-pink-400" /> Conexiones por Horario
                            </h3>
                            {data.hourly.length > 0 ? (
                                <div className="aspect-video w-full max-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.hourly}>
                                            <defs>
                                                <linearGradient id="colorViewers2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                            <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                            <Area type="monotone" dataKey="viewers" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorViewers2)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-600 text-xs">Sin datos de conexiones por horario. El canal emitirá datos a medida que los espectadores se conecten.</div>
                            )}
                        </div>
                    )}

                    {reportTab === 'traffic' && (
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <Wifi className="w-4 h-4 text-pink-400" /> Ancho de Banda (GB)
                            </h3>
                            {data.daily.length > 0 ? (
                                <div className="aspect-video w-full max-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.daily}>
                                            <defs>
                                                <linearGradient id="colorBw2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                            <YAxis stroke="#64748b" fontSize={10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                            <Area type="monotone" dataKey="gb" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorBw2)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-600 text-xs">Sin datos de tráfico aún. El consumo se registrará cuando haya espectadores activos.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </VideoStationLayout>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
    title: string; value: string; subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'pink' | 'violet' | 'cyan';
}) {
    const colors: Record<string, string> = {
        pink: 'text-pink-400 border-pink-500/10 bg-pink-500/5',
        violet: 'text-violet-400 border-violet-500/10 bg-violet-500/5',
        cyan: 'text-cyan-400 border-cyan-500/10 bg-cyan-500/5',
    };
    return (
        <div className={`p-5 rounded-2xl border ${colors[color]} backdrop-blur-xs flex flex-col gap-2`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {title}
            </span>
            <span className="text-2xl font-black font-mono text-white">{value}</span>
            <span className="text-[10px] text-slate-500">{subtitle}</span>
        </div>
    );
}
