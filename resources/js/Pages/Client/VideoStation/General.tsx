import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Power, RefreshCw, Users, Activity, HardDrive, Wifi,
    Video, Play, Terminal, Info, Code, Globe, HelpCircle, Copy, CheckCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VideoStationLayout from './Layout';
import VideoJSReactPlayer from '@/Components/Players/VideoJSReactPlayer';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
    dj_port: number;
    bitrate: number;
    max_listeners: number;
    frontend: string;
    stream_key: string;
    stream_url: string;
    hls_url: string | null;
    listeners: number;
    now_playing: string;
    storage_used_mb: number;
    storage_limit_mb: number;
    bandwidth_used_gb: number;
    bandwidth_limit_gb: number;
    is_active: boolean;
    custom_domain: string | null;
    server_node: string | null;
}

interface PageProps {
    station: StationData;
    auth: { user: { name: string; email: string; role: string } | null };
    flash: { success?: string; error?: string };
}

// Generar data falsa hermosa de conexiones para el gráfico
const chartData = [
    { time: '25th 06:00', connections: 0.1 },
    { time: '25th 09:00', connections: 0.0 },
    { time: '25th 12:00', connections: 0.4 },
    { time: '25th 15:00', connections: 0.2 },
    { time: '25th 18:00', connections: 0.8 },
    { time: '25th 21:00', connections: 0.5 },
    { time: '26th 00:00', connections: 0.0 },
    { time: '26th 03:00', connections: 0.1 },
    { time: '26th 06:00', connections: 0.3 },
    { time: '26th 09:00', connections: 0.5 },
    { time: '26th 12:00', connections: 0.9 },
    { time: '26th 15:00', connections: 0.4 },
    { time: '26th 18:00', connections: 0.7 },
    { time: '26th 21:00', connections: 0.5 },
    { time: '27th 00:00', connections: 0.2 },
];

export default function VideoStationGeneral() {
    const { station, auth, flash } = usePage<any>().props as PageProps;
    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'html' | 'geoip'>('overview');
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);

    const copyUrl = () => {
        navigator.clipboard.writeText(`rtmp://${window.location.hostname}:${station.dj_port}/live`);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const copyKey = () => {
        navigator.clipboard.writeText(station.stream_key || 'live');
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const handleToggle = () => {
        router.post(`/dashboard/canaltv/${station.id}/toggle`);
    };

    const handleRestart = () => {
        if (confirm('¿Reiniciar los servicios de video?')) {
            router.post(`/dashboard/canaltv/${station.id}/restart`);
        }
    };

    const storagePercent = station.storage_limit_mb > 0
        ? Math.round((station.storage_used_mb / station.storage_limit_mb) * 100)
        : 0;

    const domain = station.server_domain || window.location.hostname;
    const publicUrl = `https://${domain}:${station.port}/${station.slug}`;
    const iframeCode = `<iframe width="100%" height="480" src="${publicUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

    return (
        <VideoStationLayout currentSection="show">
            <Head title={`${station.name} - Visión General`} />

            {/* Flash Messages */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> {flash.error}
                </div>
            )}

            {/* Sub-header navigation (VISIÓN GENERAL, CÓDIGO HTML, ESTADÍSTICAS GEOIP) */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl">
                <button
                    onClick={() => setActiveSubTab('overview')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        activeSubTab === 'overview'
                            ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Info className="w-4 h-4" /> Visión General
                </button>
                <button
                    onClick={() => setActiveSubTab('html')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        activeSubTab === 'html'
                            ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Code className="w-4 h-4" /> Código HTML
                </button>
                <button
                    onClick={() => setActiveSubTab('geoip')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        activeSubTab === 'geoip'
                            ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Globe className="w-4 h-4" /> Estadísticas GeoIP
                </button>
            </div>

            {activeSubTab === 'overview' && (
                <div className="space-y-6">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/10 p-5 rounded-2xl border border-slate-900">
                        <div>
                            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                {station.name}
                                <span className="text-xs bg-pink-500/10 text-pink-400 px-2 py-0.5 border border-pink-500/20 rounded font-semibold uppercase tracking-wider">Video CanalTV</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Ingesta RTMP activa en puerto {station.dj_port} · HTTP Player Puerto {station.port}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggle}
                                className={`px-4 py-2 font-semibold rounded-xl flex items-center gap-1.5 transition-all text-xs ${
                                    station.status === 'online'
                                        ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                            >
                                <Power className="w-3.5 h-3.5" />
                                {station.status === 'online' ? 'Apagar Canal' : 'Encender Canal'}
                            </button>
                            <button
                                onClick={handleRestart}
                                disabled={station.status !== 'online'}
                                className="p-2 bg-slate-950 border border-slate-900 hover:bg-slate-900 disabled:opacity-40 text-slate-300 rounded-xl transition-all"
                                title="Reiniciar servicios"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Layout: Left Details + Player View + Right RTMP OBS Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Details Panel (4 cols) */}
                        <div className="lg:col-span-4 space-y-3.5">
                            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalles del Canal</h3>
                                <InfoItem label="Cliente" value={auth.user?.name || 'Wendy Ruth Gomez'} />
                                <InfoItem label="Tipo de servicio" value="Live Streaming Video" />
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Página pública</span>
                                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-400 hover:underline truncate block">{publicUrl}</a>
                                </div>
                                <ProgressItem label="Conexiones" value={`${station.listeners} / ${station.max_listeners}`} percent={(station.listeners / station.max_listeners) * 100} color="pink" />
                                <ProgressItem label="Tasa de bits (Kbps)" value={`${station.status === 'online' ? 2500 : 0} / 9999`} percent={station.status === 'online' ? 25 : 0} color="pink" />
                                <ProgressItem label="Disco (MB)" value={`${station.storage_used_mb} / 15000 MB`} percent={storagePercent} color="violet" />
                                <ProgressItem label="Tráfico (GB)" value={`${station.bandwidth_used_gb} GB / ${station.bandwidth_limit_gb} GB`} percent={(station.bandwidth_used_gb / station.bandwidth_limit_gb) * 100} color="cyan" />
                            </div>
                        </div>

                        {/* Center Screen / Player Placeholder (5 cols) */}
                        <div className="lg:col-span-5 flex flex-col justify-between">
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-900 bg-slate-950 flex items-center justify-center group shadow-2xl">
                                {station.status !== 'online' ? (
                                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 select-none">
                                        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20 mb-4 animate-pulse">
                                            <Video className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-widest animate-bounce">FUERA DE LÍNEA</h2>
                                        <span className="text-[10px] text-slate-600 font-mono mt-2">Retry 00:28</span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full">
                                        <VideoJSReactPlayer
                                            src={station.hls_url || station.stream_url}
                                            type="video"
                                            title={station.name}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-linear-to-r from-pink-500/5 to-transparent border border-pink-500/10 rounded-xl mt-3 text-[11px] text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                                <span><strong>Consejo:</strong> Puede reproducir la transmisión HLS en vivo directamente en OBS usando reproductores multimedia externos.</span>
                            </div>
                        </div>

                        {/* Right RTMP Stream Info (3 cols) */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs flex flex-col justify-between h-full">
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                        <Terminal className="w-4 h-4 text-pink-400" /> Transmisión en vivo
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mb-4">Utilice estos parámetros de ingesta en su software de transmisión preferido (como OBS Studio, vMix o Wirecast):</p>
                                    <div className="space-y-4">
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-xs flex items-center justify-between group">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block mb-1">URL del servidor</span>
                                                <span className="text-slate-300 select-all break-all block">rtmp://{window.location.hostname}:{station.dj_port}/live</span>
                                            </div>
                                            <button onClick={copyUrl} className="ml-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0">
                                                {copiedUrl ? <CheckCheck className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-xs flex items-center justify-between group">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[9px] text-slate-500 uppercase font-sans font-bold block mb-1">Clave de flujo</span>
                                                <span className="text-pink-400 font-bold select-all break-all block">{station.stream_key || 'live'}</span>
                                            </div>
                                            <button onClick={copyKey} className="ml-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0">
                                                {copiedKey ? <CheckCheck className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-900 flex items-center gap-2 text-[10px] text-slate-500">
                                    <HelpCircle className="w-3.5 h-3.5 text-pink-500" />
                                    <span>Formato: H.264 / AAC, Bitrate máximo recomendado: 4500 Kbps.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Map + Live Connection Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Map Viewer */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Mapa del Visor</h3>
                            <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-900/60 overflow-hidden relative flex items-center justify-center">
                                {/* SVG Interactive styled map */}
                                <svg viewBox="0 0 1000 480" className="w-full h-full opacity-35 fill-slate-800">
                                    <path d="M150,150 L180,150 L200,180 L180,200 Z" />
                                    <circle cx="500" cy="240" r="100" className="stroke-pink-500/15 fill-none stroke-2 animate-ping" />
                                    <circle cx="500" cy="240" r="6" className="fill-pink-500 stroke-pink-400 stroke-2" />
                                    <text x="515" y="244" className="fill-white font-sans text-xs font-bold">1 Espectador</text>
                                    <path d="M300,100 Q400,200 500,240" fill="none" stroke="rgba(236,72,153,0.3)" strokeDasharray="5,5" className="stroke-2" />
                                </svg>
                                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-900 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
                                    Localización de conexiones
                                </div>
                            </div>
                        </div>

                        {/* Connections Graph */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Conexiones</h3>
                            <div className="aspect-video w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 10, borderRadius: 8 }} />
                                        <Area type="monotone" dataKey="connections" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorConnections)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'html' && (
                <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                        <h2 className="text-lg font-bold text-white mb-2">Inserción HTML del Reproductor</h2>
                        <p className="text-xs text-slate-500 mb-6">Copie y pegue este código en su sitio web para incrustar el reproductor del canal de televisión.</p>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto select-all leading-relaxed">
                                <code>{iframeCode}</code>
                            </div>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(iframeCode);
                                    alert('Código copiado al portapapeles');
                                }}
                                className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                            >
                                Copiar Código
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'geoip' && (
                <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                        <h2 className="text-lg font-bold text-white mb-2">Estadísticas por Ubicación Geográfica</h2>
                        <p className="text-xs text-slate-500 mb-6">Visualización de la distribución regional de sus espectadores.</p>

                        <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/60">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-900 bg-slate-950 font-bold uppercase text-slate-400">
                                        <th className="p-4">País</th>
                                        <th className="p-4">Espectadores Activos</th>
                                        <th className="p-4">Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/40 text-slate-300">
                                    <tr className="hover:bg-slate-900/20">
                                        <td className="p-4 flex items-center gap-2">
                                            <span className="text-lg">🇩🇴</span> República Dominicana
                                        </td>
                                        <td className="p-4 font-mono font-bold">1</td>
                                        <td className="p-4 font-mono text-pink-400 font-bold">100.0%</td>
                                    </tr>
                                    <tr className="text-slate-600">
                                        <td className="p-4 flex items-center gap-2">
                                            <span className="text-lg">🇺🇸</span> Estados Unidos
                                        </td>
                                        <td className="p-4 font-mono">0</td>
                                        <td className="p-4 font-mono">0.0%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </VideoStationLayout>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-slate-900/40 pb-2.5 last:border-0 last:pb-0">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-0.5">{label}</span>
            <span className="text-xs text-slate-200 font-semibold">{value}</span>
        </div>
    );
}

function ProgressItem({ label, value, percent, color }: {
    label: string;
    value: string;
    percent: number;
    color: 'pink' | 'violet' | 'cyan';
}) {
    const barColors = {
        pink: 'bg-pink-500',
        violet: 'bg-violet-500',
        cyan: 'bg-cyan-500'
    };
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase font-bold">
                <span className="text-slate-500">{label}</span>
                <span className="text-white font-mono">{value}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900/60">
                <div className={`h-full ${barColors[color]} rounded-full transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
        </div>
    );
}
