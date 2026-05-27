import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { BarChart3, Users, Clock, Wifi, Calendar, Disc, Play } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

const trafficData = [
    { name: 'Lun', gb: 4.2 },
    { name: 'Mar', gb: 5.8 },
    { name: 'Mie', gb: 6.1 },
    { name: 'Jue', gb: 3.9 },
    { name: 'Vie', gb: 8.4 },
    { name: 'Sab', gb: 11.2 },
    { name: 'Dom', gb: 9.3 },
];

const listenersTime = [
    { time: '00:00', count: 1 },
    { time: '04:00', count: 0 },
    { time: '08:00', count: 4 },
    { time: '12:00', count: 8 },
    { time: '16:00', count: 12 },
    { time: '20:00', count: 18 },
];

const sessionsDuration = [
    { name: '0-5 min', count: 25 },
    { name: '5-15 min', count: 14 },
    { name: '15-30 min', count: 32 },
    { name: '30-60 min', count: 18 },
    { name: '1h+', count: 9 },
];

export default function AudioStationReports() {
    const { station } = usePage<any>().props as PageProps;
    const [reportTab, setReportTab] = useState<'summary' | 'sessions' | 'time' | 'tracks' | 'mounts' | 'traffic'>('summary');

    return (
        <AudioStationLayout currentSection="reports">
            <Head title={`${station.name} - Informes`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        Informes y Estadísticas
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Consulte los reportes de oyentes, canciones emitidas y tráfico consumido de su radio</p>
                </div>
            </div>

            {/* Sub-tabs for Reports */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl overflow-x-auto">
                <button
                    onClick={() => setReportTab('summary')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'summary' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Summary
                </button>
                <button
                    onClick={() => setReportTab('sessions')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'sessions' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Sessions
                </button>
                <button
                    onClick={() => setReportTab('time')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'time' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Sessions By Time Period
                </button>
                <button
                    onClick={() => setReportTab('tracks')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'tracks' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Tracks
                </button>
                <button
                    onClick={() => setReportTab('mounts')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'mounts' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Mount Points
                </button>
                <button
                    onClick={() => setReportTab('traffic')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shrink-0 ${
                        reportTab === 'traffic' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Traffic
                </button>
            </div>

            <div className="space-y-6">
                {reportTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatSummaryCard title="Oyentes Únicos" value="128" subtitle="Últimos 7 días" icon={Users} color="indigo" />
                        <StatSummaryCard title="Duración Promedio" value="42 min" subtitle="Por oyente" icon={Clock} color="violet" />
                        <StatSummaryCard title="Tráfico Mensual" value="48.7 GB" subtitle="De 5 TB asignados" icon={Wifi} color="emerald" />
                    </div>
                )}

                {reportTab === 'sessions' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-400" /> Historial de Duración de Sesiones
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sessionsDuration}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {reportTab === 'time' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-400" /> Oyentes Concurrentes por Horario
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={listenersTime}>
                                    <defs>
                                        <linearGradient id="colorAudioViewers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAudioViewers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {reportTab === 'tracks' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Disc className="w-4 h-4 text-indigo-400" /> Canciones más Reproducidas
                        </h3>
                        <div className="space-y-3">
                            <TrackRow rank={1} title="Antony Santos - Voy Pa'llá" plays={45} />
                            <TrackRow rank={2} title="Aventura - Obsesión" plays={32} />
                            <TrackRow rank={3} title="Romeo Santos - Propuesta Indecente" plays={28} />
                        </div>
                    </div>
                )}

                {reportTab === 'mounts' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Disc className="w-4 h-4 text-indigo-400" /> Oyentes por Punto de Montaje
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                                <span className="text-xs font-mono font-bold text-indigo-400">/radio.mp3</span>
                                <span className="text-xs font-bold text-white">0 oyentes activos (128 kbps MP3)</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-900 rounded-xl">
                                <span className="text-xs font-mono font-bold text-indigo-400">/live.mp3</span>
                                <span className="text-xs font-bold text-white">0 oyentes activos (192 kbps MP3)</span>
                            </div>
                        </div>
                    </div>
                )}

                {reportTab === 'traffic' && (
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-sm">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <Wifi className="w-4 h-4 text-indigo-400" /> Ancho de Banda Consumido (GB)
                        </h3>
                        <div className="aspect-video w-full max-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trafficData}>
                                    <defs>
                                        <linearGradient id="colorAudioBw" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b' }} />
                                    <Area type="monotone" dataKey="gb" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAudioBw)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </AudioStationLayout>
    );
}

function StatSummaryCard({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'violet' | 'emerald';
}) {
    const colors = {
        indigo: 'text-indigo-400 border-indigo-500/10 bg-indigo-500/5',
        violet: 'text-violet-400 border-violet-500/10 bg-violet-500/5',
        emerald: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5'
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

function TrackRow({ rank, title, plays }: { rank: number; title: string; plays: number }) {
    return (
        <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
                <span className="font-bold text-slate-500 font-mono">#{rank}</span>
                <span className="font-bold text-slate-200">{title}</span>
            </div>
            <span className="font-mono text-slate-400">{plays} reproducciones</span>
        </div>
    );
}
