import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Power, RefreshCw, Users, Activity, HardDrive, Wifi,
    Disc, Play, Pause, Music, Radio, Globe, Heart, Shield, Server, Repeat,
    Save, HelpCircle, Copy, Check, MapPin
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AudioStationLayout from './Layout';
import PlayerSelector from '@/Components/PlayerSelector';
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
    artist: string;
    title: string;
    server_domain: string;
    recently_played: RecentlyPlayedItem[];
    storage_used_mb: number;
    storage_limit_mb: number;
    bandwidth_used_gb: number;
    bandwidth_limit_gb: number;
    is_active: boolean;
    custom_domain: string | null;
    server_node: string | null;
}

interface RecentlyPlayedItem {
    title: string;
    played_at: string;
    timestamp: number;
}

interface PageProps {
    station: StationData;
    auth: { user: { name: string; email: string; role: string } | null };
    flash: { success?: string; error?: string };
}

export default function AudioStationGeneral() {
    const { station, auth, flash } = usePage<any>().props as PageProps;
    const [subTab, setSubTab] = useState<'general' | 'limits' | 'features' | 'icecast' | 'autodj' | 'relay'>('general');
    const [isPlaying, setIsPlaying] = useState(false);

    // ICEcast form state
    const [icecast, setIcecast] = useState({ server: '', port: '', mount_point: '', source_password: '', admin_password: '' });
    const [icecastLoading, setIcecastLoading] = useState(true);
    const [icecastSaving, setIcecastSaving] = useState(false);
    const [icecastMsg, setIcecastMsg] = useState<{type:string;text:string}|null>(null);

    // AutoDJ guide state
    const [autodjGuide, setAutodjGuide] = useState<any>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [copiedStep, setCopiedStep] = useState<number|null>(null);

    // Map state
    const [showMap, setShowMap] = useState(false);

    const apiH = () => ({
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
    });

    useEffect(() => {
        fetch(`/dashboard/station/${station.id}/icecast-connection`, { headers: apiH() })
            .then(r => r.json())
            .then(d => setIcecast({ server: d.server || '', port: String(d.port || ''), mount_point: d.mount_point || '', source_password: d.source_password || '', admin_password: d.admin_password || '' }))
            .catch(() => {})
            .finally(() => setIcecastLoading(false));
    }, []);

    const saveIcecast = () => {
        setIcecastSaving(true);
        setIcecastMsg(null);
        fetch(`/dashboard/station/${station.id}/icecast-connection`, {
            method: 'POST',
            headers: { ...apiH(), 'Content-Type': 'application/json' },
            body: JSON.stringify(icecast),
        })
            .then(r => r.json())
            .then(d => setIcecastMsg(d.success ? {type:'success',text:d.message} : {type:'error',text:d.error||'Error'}))
            .catch(() => setIcecastMsg({type:'error',text:'Error de red'}))
            .finally(() => setIcecastSaving(false));
    };

    const loadAutodjGuide = () => {
        setShowGuide(true);
        fetch(`/dashboard/station/${station.id}/autodj-connection`, { headers: apiH() })
            .then(r => r.json())
            .then(d => setAutodjGuide(d))
            .catch(() => {});
    };

    const handleToggle = () => {
        router.post(`/dashboard/station/${station.id}/toggle`);
    };

    const handleRestart = () => {
        if (confirm('¿Reiniciar los servicios de audio?')) {
            router.post(`/dashboard/station/${station.id}/restart`);
        }
    };

    return (
        <AudioStationLayout currentSection="show">
            <Head title={`${station.name} - Información General`} />

            {/* Flash */}
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

            {/* Sub-tabs inside general view */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl">
                <button
                    onClick={() => setSubTab('general')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'general' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    General
                </button>
                <button
                    onClick={() => setSubTab('limits')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'limits' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Limits
                </button>
                <button
                    onClick={() => setSubTab('features')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'features' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Features
                </button>
                <button
                    onClick={() => setSubTab('icecast')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'icecast' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Icecast 2 KH
                </button>
                <button
                    onClick={() => setSubTab('autodj')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'autodj' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    AutoDJ
                </button>
                <button
                    onClick={() => setSubTab('relay')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        subTab === 'relay' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Relay
                </button>
            </div>

            {subTab === 'general' && (
                <div className="space-y-6">
                    {/* Top Row Cards: Player + Listeners + Bandwidth + Disk Quota */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Audio Player Card (Antony Santos theme from image 2) */}
                        <div className="md:col-span-1 p-4 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between aspect-square">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    AUTODJ ACTIVO
                                </span>
                                <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                            </div>

                            <div className="flex flex-col items-center text-center my-4 space-y-2">
                                <div className="relative w-20 h-20 rounded-full border border-indigo-500/30 overflow-hidden flex items-center justify-center bg-slate-950">
                                    <Disc className={`w-12 h-12 text-indigo-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-extrabold text-white truncate">{station.artist || 'AutoDJ'}</h4>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{station.title || station.now_playing}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-all shadow-md shrink-0"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                                </button>
                                <span className="text-[9px] text-slate-500 font-bold uppercase hover:text-slate-300 cursor-pointer">Como Conectar?</span>
                            </div>
                        </div>

                        {/* Listeners Card */}
                        <StatCard label="Oyentes" value={`${station.listeners} / ${station.max_listeners}`} icon={Users} color="indigo" extraLink="Ver Oyentes" />

                        {/* Bandwidth Card */}
                        <StatCard label="Ancho de Banda" value={`${station.bandwidth_used_gb} GB / ${station.bandwidth_limit_gb} GB`} icon={Wifi} color="violet" extraLink="Historial de ancho de banda" />

                        {/* Disk Quota Card */}
                        <StatCard label="Cuota de Disco" value={`${station.storage_used_mb} MB / ${station.storage_limit_mb} MB`} icon={HardDrive} color="emerald" extraLink="Administrar Medios" />
                    </div>

                    {/* Bottom: Recently Played + Map + 12h Listeners Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Recently Played (4 cols) */}
                        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Music className="w-4 h-4 text-indigo-400" /> Recientemente Jugado
                                </h3>
                                <div className="space-y-3.5">
                                    {station.recently_played && station.recently_played.length > 0 ? (
                                        station.recently_played.map((track, i) => (
                                            <PlayedSong key={i} title={track.title} time={track.played_at} />
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-xs text-slate-500">
                                            No hay canciones reproducidas aún. <br />
                                            La música se registrará cuando AutoDJ o un encoder transmita.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Map Viewer (4 cols) */}
                        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-indigo-400" /> Mapa del Visor
                                </h3>
                                <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-900 overflow-hidden relative"
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
                                                        const station = data.stations.find((s: any) => s.name === station?.name);
                                                        if (station) {
                                                            const lat = 20 + Math.random() * 20;
                                                            const lng = -80 + Math.random() * 60;
                                                            for (let i = 0; i < Math.min(station.listeners, 20); i++) {
                                                                const m = L.circleMarker(
                                                                    [lat + (Math.random()-0.5)*15, lng + (Math.random()-0.5)*30],
                                                                    { radius: 4, color: '#818cf8', fillColor: '#6366f1', fillOpacity: 0.7, weight: 1 }
                                                                ).bindPopup(`${station.name}: ${station.listeners} oyentes`);
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
                        </div>

                        {/* Listeners Graph (4 cols) */}
                        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-400" /> Oyentes de las últimas 12 horas
                                </h3>
                                <div className="aspect-video w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[{ time: 'Ahora', listeners: station.listeners }]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorAudioListeners" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                                            <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', fontSize: 10 }} />
                                            <Area type="monotone" dataKey="listeners" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAudioListeners)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'limits' && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs">
                    <h3 className="text-sm font-bold text-white mb-4">Límites Asignados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <LimitItem label="Oyentes máximos" value={`${station.max_listeners} oyentes`} />
                        <LimitItem label="Bitrate de transmisión" value={`${station.bitrate} kbps`} />
                        <LimitItem label="Límite de disco para AutoDJ" value={`${station.storage_limit_mb} MB`} />
                        <LimitItem label="Tránsito de datos (Tráfico)" value={`${station.bandwidth_limit_gb} GB mensuales`} />
                    </div>
                </div>
            )}

            {subTab === 'features' && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs space-y-4">
                    <h3 className="text-sm font-bold text-white mb-2">Características del Servidor</h3>
                    <FeatureItem label="Soporte Icecast SSL Habilitado" description="Emisión segura bajo HTTPS nativo." active />
                    <FeatureItem label="AutoDJ integrado (Liquidsoap)" description="Automatiza la reproducción las 24 horas." active />
                    <FeatureItem label="Grabador de Streams" description="Guarda históricos de locutores y jingles." active={false} />
                </div>
            )}

            {subTab === 'icecast' && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">Servidor Icecast 2 KH</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Detalles de conexión al servidor Icecast</p>
                        </div>
                        <button onClick={saveIcecast} disabled={icecastSaving}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                            <Save className="w-3.5 h-3.5"/>{icecastSaving ? 'Guardando...' : 'Guardar Conexión'}
                        </button>
                    </div>

                    {icecastMsg && (
                        <div className={`p-3 rounded-xl text-xs ${icecastMsg.type==='success'?'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400':'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            {icecastMsg.text}
                        </div>
                    )}

                    {icecastLoading ? <div className="text-center py-8 text-slate-500 text-xs">Cargando...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Servidor</label>
                                <input type="text" value={icecast.server} onChange={e => setIcecast({...icecast, server:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono"
                                    placeholder="icecast o stream.midominio.com" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Puerto</label>
                                <input type="number" value={icecast.port} onChange={e => setIcecast({...icecast, port:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono"
                                    placeholder="8000" min={1} max={65535} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Mount Point</label>
                                <input type="text" value={icecast.mount_point} onChange={e => setIcecast({...icecast, mount_point:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono"
                                    placeholder="/radio.mp3" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Source Password</label>
                                <input type="password" value={icecast.source_password} onChange={e => setIcecast({...icecast, source_password:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono"
                                    placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase block mb-1.5 font-semibold">Admin Password</label>
                                <input type="password" value={icecast.admin_password} onChange={e => setIcecast({...icecast, admin_password:e.target.value})}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-500 text-slate-200 font-mono"
                                    placeholder="••••••••" />
                            </div>
                        </div>
                    )}

                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 mt-4">
                        <div className="flex items-start gap-2 text-[10px] text-indigo-400">
                            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0"/>
                            <div>Las contraseñas se almacenan encriptadas en la base de datos. El sistema se conecta automáticamente al servidor Icecast usando estas credenciales para obtener estadísticas en tiempo real y actualizar metadatos.</div>
                        </div>
                    </div>
                </div>
            )}

            {subTab === 'autodj' && (
                <div className="space-y-5">
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs space-y-4">
                        <h3 className="text-sm font-bold text-white">Consola AutoDJ</h3>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-slate-500">Motor</span><span className="text-indigo-400 font-bold">Liquidsoap 2.2.5</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Orden de listas</span><span className="text-slate-300">Programación aleatoria adaptativa</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Crossfade</span><span className="text-slate-300">Habilitado (2.5 segundos)</span></div>
                        </div>
                    </div>

                    {/* How to Connect */}
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-indigo-400"/> ¿Cómo Conectarse?
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Guía paso a paso para transmitir desde tu encoder</p>
                            </div>
                            <button onClick={loadAutodjGuide}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all">
                                {showGuide ? 'Recargar Datos' : 'Ver Guía de Conexión'}
                            </button>
                        </div>

                        {showGuide && (
                            autodjGuide ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                                        <div className="flex justify-between"><span className="text-slate-500">Motor</span><span className="text-indigo-400 font-bold">{autodjGuide.engine}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Modo</span><span className="text-slate-300">{autodjGuide.mode}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Crossfade</span><span className="text-slate-300">{autodjGuide.crossfade}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Encoder</span><span className="text-slate-300">{autodjGuide.connection.encoder}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Bitrate</span><span className="text-slate-300">{autodjGuide.connection.bitrate}</span></div>
                                    </div>

                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                                        <h4 className="text-xs font-bold text-white mb-2">Datos de Conexión</h4>
                                        <InfoRow2 label="Host" value={autodjGuide.connection.host} onCopy={() => {navigator.clipboard.writeText(autodjGuide.connection.host); setCopiedStep(-1); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-1} />
                                        <InfoRow2 label="Puerto" value={String(autodjGuide.connection.port)} onCopy={() => {navigator.clipboard.writeText(String(autodjGuide.connection.port)); setCopiedStep(-2); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-2} />
                                        <InfoRow2 label="Mount" value={autodjGuide.connection.mount} onCopy={() => {navigator.clipboard.writeText(autodjGuide.connection.mount); setCopiedStep(-3); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-3} />
                                        <InfoRow2 label="Source Password" value={autodjGuide.connection.source_password} onCopy={() => {navigator.clipboard.writeText(autodjGuide.connection.source_password); setCopiedStep(-4); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-4} />
                                    </div>

                                    {autodjGuide.dj_live && (
                                        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 space-y-2 text-xs">
                                            <h4 className="text-xs font-bold text-amber-400 mb-2">Conexión DJ en Vivo</h4>
                                            <InfoRow2 label="Host" value={autodjGuide.dj_live.host} onCopy={() => {navigator.clipboard.writeText(autodjGuide.dj_live.host); setCopiedStep(-5); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-5} />
                                            <InfoRow2 label="Puerto" value={String(autodjGuide.dj_live.port)} onCopy={() => {navigator.clipboard.writeText(String(autodjGuide.dj_live.port)); setCopiedStep(-6); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-6} />
                                            <InfoRow2 label="Mount" value={autodjGuide.dj_live.mount} onCopy={() => {navigator.clipboard.writeText(autodjGuide.dj_live.mount); setCopiedStep(-7); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-7} />
                                            <InfoRow2 label="Password" value={autodjGuide.dj_live.password} onCopy={() => {navigator.clipboard.writeText(autodjGuide.dj_live.password); setCopiedStep(-8); setTimeout(()=>setCopiedStep(null),2000);}} copied={copiedStep===-8} />
                                        </div>
                                    )}

                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2">
                                        <h4 className="text-xs font-bold text-white mb-2">Instrucciones Paso a Paso</h4>
                                        {autodjGuide.steps.map((step: string, idx: number) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-400 py-1">
                                                <span className="text-indigo-400 font-bold shrink-0">{idx+1}.</span>
                                                <span className="flex-1">{step}</span>
                                                <button onClick={() => {navigator.clipboard.writeText(step); setCopiedStep(idx); setTimeout(()=>setCopiedStep(null),2000);}}
                                                    className="shrink-0 p-1 text-slate-600 hover:text-indigo-400 transition-colors">
                                                    {copiedStep===idx ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500"><div className="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-2"></div> Cargando datos...</div>
                            )
                        )}

                        {!showGuide && (
                            <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center space-y-3">
                                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto"/>
                                <p className="text-xs text-slate-500">Haz clic en "Ver Guía de Conexión" para obtener instrucciones personalizadas con datos reales de tu servidor.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {subTab === 'relay' && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs">
                    <h3 className="text-sm font-bold text-white mb-2">Configuración de Relay (Repetidores)</h3>
                    <p className="text-xs text-slate-500">El servicio permite retransmitir emisoras remotas de Icecast o Shoutcast utilizando puntos de montaje locales.</p>
                    <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-800 text-center py-8 text-xs text-slate-500">
                        No hay relays configurados para este servidor.
                    </div>
                </div>
            )}
        </AudioStationLayout>
    );
}

function StatCard({ label, value, icon: Icon, color, extraLink }: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'violet' | 'emerald';
    extraLink: string;
}) {
    const colors = {
        indigo: 'text-indigo-400',
        violet: 'text-violet-400',
        emerald: 'text-emerald-400',
    };
    return (
        <div className="p-4 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between aspect-square">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${colors[color]}`} /> {label}
            </span>
            <div className="my-6">
                <span className="text-2xl font-black font-mono text-white">{value}</span>
            </div>
            <button className="text-[10px] text-slate-500 font-bold uppercase hover:text-slate-300 cursor-pointer block text-left">
                {extraLink}
            </button>
        </div>
    );
}

function PlayedSong({ title, time }: { title: string; time?: string }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-900">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <Disc className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-300 truncate block">{title}</span>
                {time && <span className="text-[9px] text-slate-500">{time}</span>}
            </div>
        </div>
    );
}

function InfoRow2({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 shrink-0">{label}</span>
            <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300">{value}</span>
                <button onClick={onCopy} className="p-1 text-slate-600 hover:text-indigo-400 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
}

function LimitItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex justify-between">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className="text-white font-bold font-mono">{value}</span>
        </div>
    );
}

function FeatureItem({ label, description, active }: { label: string; description: string; active: boolean }) {
    return (
        <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center">
            <div>
                <span className="text-xs font-bold text-slate-300 block">{label}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{description}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-600'
            }`}>
                {active ? 'Activo' : 'Inactivo'}
            </span>
        </div>
    );
}
