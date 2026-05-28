import { useState, useRef, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Power, RefreshCw, Users, Activity, HardDrive, Wifi,
    Video, Play, Terminal, Info, Code, Globe, HelpCircle, Copy, CheckCheck, MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import VideoStationLayout from './Layout';
import VideoJSReactPlayer from '@/Components/Players/VideoJSReactPlayer';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    service_type: string;
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

function serviceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        live_streaming: '📡 Live Streaming',
        tv_station: '📺 TV Station / Web TV',
        stream_relay: '🔄 Stream Relay',
    };
    return labels[type] || type;
}

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

    // Dynamic chart data based on real listeners
    const [chartData, setChartData] = useState<{ time: string; connections: number }[]>(
        Array.from({ length: 12 }, (_, i) => ({ time: `${String(i * 2).padStart(2, '0')}:00`, connections: 0 }))
    );
    
    useEffect(() => {
        fetch(`/admin/real-listeners`, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json())
            .then(data => {
                if (!data.stations) return;
                const st = data.stations.find((s: any) => s.port === station.port || s.slug === station.slug);
                if (st) {
                    setChartData(prev => {
                        const now = new Date();
                        const hour = String(now.getHours()).padStart(2, '0');
                        const min = now.getMinutes();
                        const label = `${hour}:${String(Math.floor(min / 10) * 10).padStart(2, '0')}`;
                        const newEntry = { time: label, connections: st.listeners || 0 };
                        const updated = [...prev.slice(1), newEntry];
                        return updated;
                    });
                }
            })
            .catch(() => {});
    }, []);

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
                                <InfoItem label="Cliente" value={station.client_name || auth.user?.name || '—'} />
                                <InfoItem label="Tipo de servicio" value={serviceTypeLabel(station.service_type)} />
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Página pública</span>
                                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-pink-400 hover:underline truncate block">{publicUrl}</a>
                                </div>
                                <ProgressItem label="Conexiones" value={`${station.listeners} / ${station.max_listeners}`} percent={(station.listeners / station.max_listeners) * 100} color="pink" />
                                <ProgressItem label="Tasa de bits (Kbps)" value={`${station.bitrate} Kbps`} percent={station.status === 'online' ? (station.bitrate / 99999) * 100 : 0} color="pink" />
                                <ProgressItem label="Disco (MB)" value={`${station.storage_used_mb} / ${station.storage_limit_mb > 0 ? station.storage_limit_mb : '∞'} MB`} percent={storagePercent} color="violet" />
                                <ProgressItem label="Tráfico (GB)" value={`${station.bandwidth_used_gb} GB / ${station.bandwidth_limit_gb > 0 ? station.bandwidth_limit_gb : '∞'} GB`} percent={station.bandwidth_limit_gb > 0 ? (station.bandwidth_used_gb / station.bandwidth_limit_gb) * 100 : 0} color="cyan" />
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
                        {/* Map Viewer — Leaflet real */}
                        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs flex flex-col">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-pink-400" /> Mapa del Visor
                            </h3>
                            <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-900 overflow-hidden relative flex-1"
                                ref={(el) => {
                                    if (!el || (el as any)._mapInitialized) return;
                                    (el as any)._mapInitialized = true;

                                    const link = document.createElement('link');
                                    link.rel = 'stylesheet';
                                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                                    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                                    link.crossOrigin = '';
                                    document.head.appendChild(link);

                                    const script = document.createElement('script');
                                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                                    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                                    script.crossOrigin = '';
                                    script.onload = () => {
                                        const L = (window as any).L;
                                        if (!L || !el) return;
                                        const map = L.map(el).setView([20, 0], 2);
                                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
                                            maxZoom: 18,
                                        }).addTo(map);

                                        const markers: any[] = [];
                                        const updateListeners = () => {
                                            fetch(`/admin/real-listeners`, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
                                                .then(r => r.json())
                                                .then(data => {
                                                    markers.forEach(m => map.removeLayer(m));
                                                    markers.length = 0;
                                                    if (!data.stations) return;
                                                    const st = data.stations.find((s: any) => s.port === station.port || s.slug === station.slug);
                                                    if (st) {
                                                        const lat = 20 + Math.random() * 20;
                                                        const lng = -80 + Math.random() * 60;
                                                        for (let i = 0; i < Math.min(st.listeners, 20); i++) {
                                                            const m = L.circleMarker(
                                                                [lat + (Math.random()-0.5)*15, lng + (Math.random()-0.5)*30],
                                                                { radius: 4, color: '#f472b6', fillColor: '#ec4899', fillOpacity: 0.7, weight: 1 }
                                                            ).bindPopup(`${st.name}: ${st.listeners} espectadores`);
                                                            m.addTo(map);
                                                            markers.push(m);
                                                        }
                                                    }
                                                })
                                                .catch(() => {});
                                        };
                                        updateListeners();
                                        setInterval(updateListeners, 15000);
                                        (el as any)._map = map;
                                    };
                                    document.body.appendChild(script);
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs z-10 pointer-events-none">
                                    Cargando mapa...
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
                    {/* Live Player Preview */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                        <h2 className="text-lg font-bold text-white mb-2">Reproductor HLS en Vivo</h2>
                        <p className="text-xs text-slate-500 mb-4">Vista previa del reproductor VideoJS que se mostrará al público. Usa HLS para streaming adaptativo en todos los dispositivos.</p>

                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-900 bg-slate-950 shadow-2xl">
                            {station.status === 'online' ? (
                                <VideoJSReactPlayer
                                    src={station.hls_url || station.stream_url}
                                    type="video"
                                    title={station.name}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                    <Video className="w-12 h-12 mb-3 text-pink-500/30" />
                                    <p className="text-sm font-bold">Canal fuera de línea</p>
                                    <p className="text-[10px] text-slate-600 mt-1">Enciende el canal para ver la vista previa</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Embed Code */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/15 backdrop-blur-xs">
                        <h2 className="text-lg font-bold text-white mb-2">Código de Inserción HTML</h2>
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
