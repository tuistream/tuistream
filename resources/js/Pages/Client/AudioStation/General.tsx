import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Power, RefreshCw, Users, Activity, HardDrive, Wifi,
    Disc, Play, Pause, Music, Radio, Globe, Heart, Shield, Server, Repeat
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
                                <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-900 overflow-hidden relative flex items-center justify-center">
                                    <svg viewBox="0 0 1000 480" className="w-full h-full opacity-20 fill-slate-800">
                                        <circle cx="500" cy="240" r="100" className="stroke-indigo-500/15 fill-none stroke-2 animate-ping" />
                                        <circle cx="500" cy="240" r="6" className="fill-indigo-500 stroke-indigo-400 stroke-2" />
                                    </svg>
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
                    <h3 className="text-sm font-bold text-white mb-2">Servidor Icecast 2 KH</h3>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">Versión</span><span className="text-slate-300">Icecast 2.4.0-kh15</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Puntos de montaje activos</span><span className="text-slate-300">/radio.mp3, /live</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Dirección del host</span><span className="text-slate-300 font-mono">{station.server_domain || 'localhost'}</span></div>
                    </div>
                </div>
            )}

            {subTab === 'autodj' && (
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs space-y-4">
                    <h3 className="text-sm font-bold text-white mb-2">Consola AutoDJ</h3>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">Motor</span><span className="text-indigo-400 font-bold">Liquidsoap 2.1.4</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Orden de listas</span><span className="text-slate-300">Programación aleatoria adaptativa</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Crossfade</span><span className="text-slate-300">Habilitado (2.5 segundos)</span></div>
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
