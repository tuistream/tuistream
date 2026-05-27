import { Head, Link, router, usePage } from '@inertiajs/react';
import { Radio, Power, RefreshCw, Users, Music, Activity, LogOut, Disc, Video, Terminal, Cast, Shield, User } from 'lucide-react';
import { useState } from 'react';
import PlayerSelector from '@/Components/PlayerSelector';
import VideoJSReactPlayer from '@/Components/Players/VideoJSReactPlayer';
import ThemeToggle from '@/Components/ThemeToggle';

interface StationProps {
    id: number;
    name: string;
    slug: string;
    port: number;
    dj_port: number;
    status: 'online' | 'offline' | 'restarting' | 'error';
    bitrate: number;
    max_listeners: number;
    stream_url: string;
    stream_key: string;
    type: 'audio' | 'video';
    frontend: string;
    listeners: number;
    now_playing: string;
    server_domain?: string;
    rtmp_domain?: string;
    dj_password?: string;
    storage_used_mb?: number;
    storage_limit_mb?: number;
}

interface StatsProps {
    total: number;
    online: number;
    audio_count: number;
    video_count: number;
}

interface PageProps {
    audioStations: StationProps[];
    videoStations: StationProps[];
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
    isImpersonating: boolean;
}

export default function ClientDashboard() {
    const { audioStations, videoStations, stats, flash, auth, isImpersonating, app } = usePage<any>().props as any;
    const [activeTab, setActiveTab] = useState<'audio' | 'video'>(
        audioStations.length > 0 ? 'audio' : 'video'
    );

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleToggle = (stationId: number) => {
        router.post(`/station/${stationId}/toggle`);
    };

    const handleRestart = (stationId: number) => {
        if (confirm('¿Reiniciar los servicios de streaming de esta estación?')) {
            router.post(`/station/${stationId}/restart`);
        }
    };

    const currentStations = activeTab === 'audio' ? audioStations : videoStations;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 overflow-x-hidden relative">
            <Head title="Mi Panel - TuiStream" />

            {/* Glowing background */}
            <div className="fixed top-0 right-1/4 w-150 h-150 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-10 left-1/4 w-150 h-150 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Impersonation Banner */}
            {isImpersonating && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                        <Shield className="w-4 h-4" />
                        <span>Viendo como <strong>{auth.user?.name}</strong> — Modo administrador</span>
                    </div>
                    <button
                        onClick={() => router.post('/admin/stop-impersonating')}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                    >
                        Volver a Admin
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 select-none">
                        {app?.logo ? (
                            <img src={app.logo} alt={app?.name || 'Logo'} className="max-h-9 max-w-[160px] object-contain" />
                        ) : (
                            <>
                                <div className="p-2 bg-linear-to-br from-indigo-500 to-violet-600 rounded-lg text-white">
                                    <Radio className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-bold tracking-tight text-white text-base">{app?.name || 'TuiStream'}</span>
                                    <span className="block text-[10px] text-slate-500 -mt-0.5">Panel de Cliente</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-400">Bienvenido</p>
                            <p className="text-sm font-bold text-slate-200">{auth.user?.name}</p>
                        </div>
                        <ThemeToggle />
                        <Link
                            href="/dashboard/profile"
                            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                            title="Mi Perfil"
                        >
                            <User className="w-5 h-5" />
                        </Link>
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

            <main className="max-w-6xl mx-auto px-6 mt-8 relative z-10">

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

                {/* Stats Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Mis Estaciones</span>
                        <span className="text-3xl font-extrabold font-mono text-white">{stats.total}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">En Línea</span>
                        <span className="text-3xl font-extrabold font-mono text-emerald-400">{stats.online}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Radios</span>
                        <span className="text-3xl font-extrabold font-mono text-indigo-400">{stats.audio_count}</span>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 flex flex-col gap-2">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Canales Video</span>
                        <span className="text-3xl font-extrabold font-mono text-pink-400">{stats.video_count}</span>
                    </div>
                </div>

                {stats.total === 0 ? (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm p-8 text-center max-w-lg mx-auto mt-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                        <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-lg font-bold text-white mb-2">No tienes servicios activos</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            Tu cuenta ha sido creada exitosamente, pero el administrador aún no ha asignado ni configurado
                            ninguna emisora de radio o canal de video para ti en este momento.
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                            Por favor, ponte en contacto con soporte técnico para activar tus servicios.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex items-center gap-2 mb-6">
                            {audioStations.length > 0 && (
                                <button
                                    onClick={() => setActiveTab('audio')}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                                        activeTab === 'audio'
                                            ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                            : 'text-slate-500 hover:text-white border border-transparent hover:border-slate-900'
                                    }`}
                                >
                                    <Music className="w-4 h-4" /> Mis Radios ({audioStations.length})
                                </button>
                            )}
                            {videoStations.length > 0 && (
                                <button
                                    onClick={() => setActiveTab('video')}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                                        activeTab === 'video'
                                            ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                                            : 'text-slate-500 hover:text-white border border-transparent hover:border-slate-900'
                                    }`}
                                >
                                    <Video className="w-4 h-4" /> Mis Canales de Video ({videoStations.length})
                                </button>
                            )}
                        </div>

                        {/* Station Cards */}
                        <div className="space-y-6">
                            {currentStations.map((station: StationProps) => (
                                <StationCard
                                    key={station.id}
                                    station={station}
                                    onToggle={handleToggle}
                                    onRestart={handleRestart}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

/* ───────── Station Card Component ───────── */

function StationCard({ station, onToggle, onRestart }: {
    station: StationProps;
    onToggle: (id: number) => void;
    onRestart: (id: number) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isAudio = station.type === 'audio';

    return (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden transition-all hover:border-slate-800">

            {/* Header Row */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                        station.status === 'online'
                            ? isAudio
                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                                : 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                            : 'bg-slate-950 border border-slate-900 text-slate-500'
                    }`}>
                        {isAudio ? (
                            <Disc className={`w-6 h-6 ${station.status === 'online' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                        ) : (
                            <Video className={`w-6 h-6 ${station.status === 'online' ? 'animate-pulse' : ''}`} />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{station.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                station.status === 'online'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-950 border border-slate-900 text-slate-500'
                            }`}>
                                {station.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isAudio ? `${station.frontend?.toUpperCase()} · ${station.bitrate} kbps` : 'RTMP → HLS'} · Puerto: {station.port}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => onToggle(station.id)}
                        className={`flex-1 sm:flex-none px-4 py-2.5 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                            station.status === 'online'
                                ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                    >
                        <Power className="w-4 h-4" />
                        {station.status === 'online' ? 'Apagar' : 'Encender'}
                    </button>

                    <button
                        onClick={() => onRestart(station.id)}
                        disabled={station.status !== 'online'}
                        className="px-3 py-2.5 bg-slate-950 border border-slate-900 hover:bg-slate-900 disabled:opacity-40 text-slate-300 rounded-xl transition-all"
                        title="Reiniciar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-2.5 bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-400 rounded-xl transition-all text-xs font-semibold"
                    >
                        {expanded ? 'Ocultar' : 'Detalles'}
                    </button>

                    <Link
                        href={station.type === 'video' ? `/dashboard/canaltv/${station.id}` : `/dashboard/station/${station.id}`}
                        className="px-3 py-2.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                    >
                        Gestionar
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-5 pb-4 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5 text-indigo-400" /> Oyentes
                    </div>
                    <span className="text-sm font-bold font-mono">{station.listeners}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="w-3.5 h-3.5 text-violet-400" /> Límite
                    </div>
                    <span className="text-sm font-bold font-mono">{station.max_listeners}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {isAudio ? <Music className="w-3.5 h-3.5 text-pink-400" /> : <Cast className="w-3.5 h-3.5 text-pink-400" />}
                        Calidad
                    </div>
                    <span className="text-sm font-bold font-mono">
                        {isAudio ? `${station.bitrate} kbps` : '1080p'}
                    </span>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-slate-900 pt-4">

                    {/* Player Selector + Player */}
                    {station.status === 'online' && (
                        <div className="mb-4 rounded-xl border border-slate-900 bg-slate-950 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">
                                    {isAudio ? 'Reproductor de Audio' : 'Reproductor de Video'}
                                </p>
                                <PlayerSelector />
                            </div>
                            <div className="p-4">
                                <VideoJSReactPlayer
                                    src={isAudio ? station.stream_url : `${station.stream_url}/hls/live.m3u8`}
                                    type={isAudio ? 'audio' : 'video'}
                                    title={station.now_playing}
                                />
                            </div>
                        </div>
                    )}

                    {/* Connection Info */}
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-900">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Terminal className="w-3.5 h-3.5 text-violet-400" />
                            {isAudio ? 'Conexión para DJs en Vivo' : 'Configuración de Ingesta RTMP'}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {isAudio ? (
                                <>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Host</span>
                                        <span className="text-slate-200">{station.server_domain || window.location.hostname}</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Puerto DJ</span>
                                        <span className="text-slate-200">{station.dj_port}</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Mountpoint</span>
                                        <span className="text-slate-200">/live</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Contraseña</span>
                                        <span className="text-indigo-400 font-bold">{station.dj_password}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">URL RTMP</span>
                                        <span className="text-slate-200">rtmp://{station.rtmp_domain || window.location.hostname}:{station.dj_port}/live</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-900/60 font-mono text-xs">
                                        <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">Stream Key</span>
                                        <span className="text-pink-400 font-bold">{station.stream_key}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
