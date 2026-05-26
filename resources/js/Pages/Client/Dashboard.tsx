import { Head, router, usePage } from '@inertiajs/react';
import { Radio, Power, RefreshCw, Users, Music, Activity, LogOut, Disc, Volume2, Video, Terminal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
    type: 'audio' | 'video';
}

interface NowPlayingProps {
    song: string;
    listeners: number;
    peak_listeners: number;
}

interface PageProps {
    station: StationProps;
    now_playing: NowPlayingProps;
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
}

export default function Dashboard() {
    const { station, now_playing, flash, auth } = usePage<any>().props as PageProps;
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Reproductor de streaming de audio
    const handlePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.load();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                console.error("Fallo al reproducir:", e);
            });
        }
    };

    const handleToggleStatus = () => {
        router.post(`/station/${station.id}/toggle`);
    };

    const handleRestart = () => {
        if (confirm('¿Estás seguro de que deseas reiniciar los hilos de streaming?')) {
            router.post(`/station/${station.id}/restart`);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    // Detener la reproducción si la estación se apaga
    useEffect(() => {
        if (station.status !== 'online' && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [station.status]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 overflow-x-hidden relative">
            <Head title={`Panel - ${station.name}`} />

            {/* Glowing background highlights */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                            <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="font-bold tracking-tight text-white">{station.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-400">Cliente Autenticado</p>
                            <p className="text-sm font-bold text-slate-200">{auth.user?.name}</p>
                        </div>
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

            {/* Dashboard Content */}
            <main className="max-w-7xl mx-auto px-6 mt-8 relative z-10">
                
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        {flash.error}
                    </div>
                )}

                {/* Grid principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Controles e Información de la Estación */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Stream Controls Panel */}
                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${
                                    station.status === 'online' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-950 text-slate-500 border border-slate-900'
                                }`}>
                                    {station.type === 'video' ? (
                                        <Video className="w-8 h-8 animate-pulse" />
                                    ) : (
                                        <Disc className={`w-8 h-8 ${station.status === 'online' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold">{station.name}</h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                            station.status === 'online' 
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                                : 'bg-slate-950 border border-slate-900 text-slate-500'
                                        }`}>
                                            {station.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Tipo: {station.type === 'video' ? 'IPTV / Video' : 'Radio FM / Audio'} | Puerto: {station.port}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleToggleStatus}
                                    className={`flex-1 md:flex-none px-5 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-lg ${
                                        station.status === 'online' 
                                            ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:shadow-red-500/[0.05]'
                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                                    }`}
                                >
                                    <Power className="w-4 h-4" />
                                    {station.status === 'online' ? 'Apagar Canal' : 'Encender Canal'}
                                </button>

                                <button
                                    onClick={handleRestart}
                                    disabled={station.status !== 'online'}
                                    className="px-4 py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 disabled:opacity-40 text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                    title="Reiniciar servicios"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Reiniciar</span>
                                </button>
                            </div>
                        </div>

                        {/* Player & Now Playing Visualizer */}
                        {station.type === 'video' ? (
                            /* VIDEO STATION PLAYBACK (HTML5 HLS PLAYER) */
                            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm relative overflow-hidden flex flex-col items-center">
                                <div className="w-full aspect-video rounded-xl border border-slate-850 bg-slate-950 overflow-hidden relative shadow-2xl">
                                    {station.status === 'online' ? (
                                        <video
                                            controls
                                            className="w-full h-full object-cover"
                                            poster="/api/placeholder/800/450"
                                            src={`${station.stream_url}/hls/live.m3u8`}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-650 font-mono">
                                            <Video className="w-16 h-16 text-slate-700 mb-4" />
                                            <span>SEÑAL EN DIRECTO FUERA DE SERVICIO</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-base font-bold text-slate-300 mt-4">
                                    {station.status === 'online' ? '🔴 Transmisión de Video en Directo (HLS)' : 'Canal Apagado'}
                                </h3>
                            </div>
                        ) : (
                            /* AUDIO STATION PLAYBACK */
                            <div className="p-8 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-sm relative overflow-hidden flex flex-col items-center justify-center text-center">
                                {station.status === 'online' && (
                                    <audio ref={audioRef} src={station.stream_url} preload="none" />
                                )}

                                <div className="relative mb-6">
                                    <div className={`w-40 h-40 rounded-full border-4 border-slate-900 bg-slate-950 shadow-2xl flex items-center justify-center overflow-hidden transition-all ${
                                        isPlaying ? 'animate-spin' : ''
                                    }`} style={{ animationDuration: '8s' }}>
                                        <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                        </div>
                                    </div>
                                    {station.status === 'online' && isPlaying && (
                                        <span className="absolute -bottom-2 -right-2 p-2 bg-indigo-500 text-white rounded-full animate-bounce shadow-md">
                                            <Volume2 className="w-4 h-4" />
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                                    {station.status === 'online' ? 'Reproduciendo en Directo' : 'Servicio Desconectado'}
                                </p>
                                <h3 className="text-lg md:text-xl font-bold max-w-lg mb-4 truncate text-slate-100">
                                    {now_playing.song}
                                </h3>

                                <button
                                    onClick={handlePlayPause}
                                    disabled={station.status !== 'online'}
                                    className={`px-8 py-3.5 rounded-full font-bold shadow-xl transition-all transform hover:-translate-y-0.5 ${
                                        isPlaying 
                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10' 
                                            : 'bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 shadow-indigo-500/10'
                                    }`}
                                >
                                    {isPlaying ? 'Pausar Reproductor' : 'Escuchar Emisión'}
                                </button>
                            </div>
                        )}

                        {/* Ingest coordinates info */}
                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60">
                            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-violet-400" />
                                {station.type === 'video' ? 'Configuración de Ingesta RTMP (OBS / vMix)' : 'Conexión para DJs en Vivo'}
                            </h3>
                            
                            {station.type === 'video' ? (
                                <>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Para transmitir video en directo a este canal, configura tu programa de transmisión (OBS Studio, vMix, Wirecast) con los siguientes parámetros de emisión:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Servidor / URL RTMP</span>
                                            <span className="text-slate-200">rtmp://stream.tuistream.com:{station.dj_port}/live</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Clave de transmisión (Stream Key)</span>
                                            <span className="text-slate-200 font-bold text-indigo-400">live</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Los DJs en directo pueden conectarse directamente para interrumpir el AutoDJ de forma
                                        automática y transmitir en tiempo real utilizando la siguiente configuración en su cliente de streaming (Butt, Mixxx):
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Servidor / Host</span>
                                            <span className="text-slate-200">stream.tuistream.com</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Puerto</span>
                                            <span className="text-slate-200">{station.dj_port}</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Punto de montaje (Mountpoint)</span>
                                            <span className="text-slate-200">/live</span>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 font-mono text-xs flex flex-col gap-1.5">
                                            <span className="text-slate-500 text-[10px] uppercase font-sans font-bold">Contraseña</span>
                                            <span className="text-slate-200 font-bold text-indigo-400">dj_pass_{station.slug}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>

                    {/* Columna Derecha: Estadísticas en vivo */}
                    <div className="space-y-8">
                        
                        {/* Live statistics */}
                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm space-y-6">
                            <h3 className="text-base font-bold text-slate-200">Métricas de Transmisión</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium uppercase">
                                        Espectadores
                                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <div className="text-2xl font-bold font-mono">{now_playing.listeners}</div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium uppercase">
                                        Pico Máximo
                                        <Activity className="w-3.5 h-3.5 text-violet-400" />
                                    </div>
                                    <div className="text-2xl font-bold font-mono">{now_playing.peak_listeners}</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4 text-pink-400" />
                                    <span className="text-sm font-semibold">Límite Permitido</span>
                                </div>
                                <span className="text-sm font-bold font-mono">{station.max_listeners}</span>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-semibold">Calidad del Stream</span>
                                </div>
                                <span className="text-sm font-bold font-mono">
                                    {station.type === 'video' ? 'Full HD 1080p (Auto)' : `${station.bitrate} kbps`}
                                </span>
                            </div>
                        </div>

                        {/* Playlists and File Upload Preview */}
                        {station.type !== 'video' && (
                            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm space-y-6">
                                <h3 className="text-base font-bold text-slate-200">Gestor de Playlist & AutoDJ</h3>
                                
                                <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-950 transition-all">
                                    <Music className="w-8 h-8 text-slate-500 mb-3" />
                                    <span className="text-sm font-bold text-slate-300">Arrastra archivos aquí</span>
                                    <span className="text-xs text-slate-500 mt-1">Formato admitido: MP3 de audio</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">General_Mix</p>
                                            <p className="text-xs text-slate-500">24 canciones cargadas</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">Activa</span>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </div>

            </main>
        </div>
    );
}
