import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { BarChart3, Users, Clock, Wifi, Calendar, CheckCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VideoStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    slug: string;
}

interface PageProps {
    station: StationData;
}

const trafficData = [
    { name: 'Lun', gb: 12.5 },
    { name: 'Mar', gb: 15.2 },
    { name: 'Mie', gb: 8.4 },
    { name: 'Jue', gb: 20.1 },
    { name: 'Vie', gb: 25.8 },
    { name: 'Sab', gb: 32.4 },
    { name: 'Dom', gb: 29.3 },
];

const hourlySessions = [
    { time: '00:00', viewers: 1 },
    { time: '04:00', viewers: 0 },
    { time: '08:00', viewers: 3 },
    { time: '12:00', viewers: 5 },
    { time: '16:00', viewers: 8 },
    { time: '20:00', viewers: 12 },
];

const sessionsSummary = [
    { name: '0-5 min', count: 12 },
    { name: '5-15 min', count: 8 },
    { name: '15-30 min', count: 15 },
    { name: '30-60 min', count: 6 },
    { name: '1h+', count: 4 },
];

export default function VideoStationReports() {
    const { station } = usePage<any>().props as PageProps;
    const [reportTab, setReportTab] = useState<'summary' | 'sessions' | 'time' | 'traffic'>('summary');

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
                    <p className="text-xs text-slate-500 mt-1">Consulte los reportes de espectación, tráfico y conexiones de su canal</p>
                </div>
            </div>

            {/* Sub-tabs for Reports */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl">
                <button
                    onClick={() => setReportTab('summary')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        reportTab === 'summary' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Summary
                </button>
                <button
                    onClick={() => setReportTab('sessions')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        reportTab === 'sessions' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Sessions
                </button>
                <button
                    onClick={() => setReportTab('time')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        reportTab === 'time' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Sessions By Time Period
                </button>
                <button
                    onClick={() => setReportTab('traffic')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        reportTab === 'traffic' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Traffic
                </button>
            </div>

            <div className="space-y-6">
                {reportTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatSummaryCard title="Espectadores Únicos" value="45" subtitle="Últimos 7 días" icon={Users} color="pink" />
                        <StatSummaryCard title="Duración Promedio" value="23 min" subtitle="Por sesión" icon={Clock} color="violet" />
                        <StatSummaryCard title="Ancho de Banda" value="29.3 GB" subtitle="Consumo mensual" icon={Wifi} color="cyan" />
                    </div>
                )}

                {reportTab === 'sessions' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-pink-400" /> Duración de Sesión de Espectadores
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sessionsSummary}>
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
                            <Calendar className="w-4 h-4 text-pink-400" /> Conexiones Concurrentes por Horario
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hourlySessions}>
                                    <defs>
                                        <linearGradient id="colorVideoViewers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Area type="monotone" dataKey="viewers" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorVideoViewers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {reportTab === 'traffic' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Wifi className="w-4 h-4 text-pink-400" /> Ancho de Banda Consumido (GB)
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorVideoBw" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Area type="monotone" dataKey="gb" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorVideoBw)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </VideoStationLayout>
    );
}

function StatSummaryCard({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'pink' | 'violet' | 'cyan';
}) {
    const colors = {
        pink: 'text-pink-400 border-pink-500/10 bg-pink-500/5',
        violet: 'text-violet-400 border-violet-500/10 bg-violet-500/5',
        cyan: 'text-cyan-400 border-cyan-500/10 bg-cyan-500/5'
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
