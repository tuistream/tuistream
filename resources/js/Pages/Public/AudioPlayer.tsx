import { useState, useRef, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Play, Pause, Volume2, VolumeX, Radio, Disc, Music, Shield } from 'lucide-react';

interface Props {
    station: {
        id: number;
        name: string;
        slug: string;
        status: string;
        port: number;
        now_playing: string;
        stream_url: string;
    };
    app: {
        logo: string;
        favicon: string;
        name: string;
    };
}

export default function AudioPlayer({ station, app }: Props) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [audioError, setAudioError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element
        const audio = new Audio(station.stream_url);
        audio.preload = 'none';
        audioRef.current = audio;

        audio.addEventListener('error', () => {
            setAudioError(true);
            setIsPlaying(false);
        });

        return () => {
            audio.pause();
            audioRef.current = null;
        };
    }, [station.stream_url]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    const handlePlayToggle = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            // Force reload stream when paused to avoid lag accumulation in live streaming
            audioRef.current.src = '';
            audioRef.current.src = station.stream_url;
            setIsPlaying(false);
        } else {
            setAudioError(false);
            audioRef.current.load();
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(() => {
                    setAudioError(true);
                    setIsPlaying(false);
                });
        }
    };

    const handleMuteToggle = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden relative">
            <Head title={`${station.name} - Escuchar en Vivo`} />

            {/* Ambient Background Lights */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="w-full py-4 px-6 border-b border-slate-900/60 backdrop-blur-md bg-slate-950/40 relative z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {app.logo ? (
                        <img src={app.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900/50 p-0.5 border border-slate-800" />
                    ) : (
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg">
                            <Radio className="w-4 h-4" />
                        </div>
                    )}
                    <span className="font-bold text-sm tracking-wider text-slate-200 uppercase">{app.name}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        station.status === 'online'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${station.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        {station.status === 'online' ? 'En Vivo' : 'Fuera de Línea'}
                    </span>
                </div>
            </header>

            {/* Central Player Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-md mx-auto w-full">
                {/* Vinyl Disc Container */}
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-8">
                    {/* Pulsing Outer Ring */}
                    <div className={`absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/10 scale-105 transition-all duration-1000 ${isPlaying ? 'animate-ping' : ''}`} />
                    <div className={`absolute inset-4 rounded-full bg-violet-500/5 border border-violet-500/10 transition-all duration-700 ${isPlaying ? 'scale-105' : ''}`} />

                    {/* Vinyl Disc */}
                    <div className={`w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-slate-900 via-black to-slate-900 border-4 border-slate-800 shadow-2xl relative flex items-center justify-center overflow-hidden transition-all duration-[3000ms] ease-in-out select-none ${
                        isPlaying ? 'rotate-360 animate-[spin_5s_linear_infinite]' : ''
                    }`}>
                        {/* Vinyl Grooves */}
                        <div className="absolute inset-4 rounded-full border border-slate-950/20" />
                        <div className="absolute inset-8 rounded-full border border-slate-950/30" />
                        <div className="absolute inset-12 rounded-full border border-slate-950/40" />
                        <div className="absolute inset-16 rounded-full border border-slate-950/50" />
                        <div className="absolute inset-20 rounded-full border border-slate-950/60" />
                        <div className="absolute inset-24 rounded-full border border-slate-950/70" />

                        {/* Album/Station Art Inner Ring */}
                        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 border-[6px] border-slate-950 shadow-inner flex flex-col items-center justify-center text-center p-3 relative z-10">
                            {app.logo ? (
                                <img src={app.logo} alt="Station" className="w-12 h-12 rounded-full object-contain mb-1 bg-slate-950/40 p-1" />
                            ) : (
                                <Disc className={`w-8 h-8 text-white mb-1 ${isPlaying ? 'animate-spin' : ''}`} />
                            )}
                            <span className="text-[9px] font-black tracking-widest text-indigo-100 uppercase truncate max-w-[80px]">{station.name}</span>
                        </div>

                        {/* Center Spindle Hole */}
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 shadow-inner absolute z-20" />
                    </div>
                </div>

                {/* Stream Info */}
                <div className="text-center w-full mb-6">
                    <h2 className="text-2xl font-black text-white tracking-tight truncate px-4">{station.name}</h2>
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5">
                        <Music className="w-3.5 h-3.5 animate-bounce" /> {station.now_playing}
                    </p>
                </div>

                {/* Control Panel Card */}
                <div className="w-full bg-slate-900/35 border border-slate-900/60 rounded-3xl p-6 backdrop-blur-lg shadow-xl relative overflow-hidden">
                    {/* Error Overlay */}
                    {audioError && (
                        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Error al cargar la señal</p>
                            <p className="text-[10px] text-slate-500 mt-1">El stream podría estar offline. Intentando de nuevo...</p>
                            <button
                                onClick={handlePlayToggle}
                                className="mt-3 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg text-[10px] transition-all"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Main controls */}
                    <div className="flex flex-col items-center gap-5">
                        {/* Play Button */}
                        <button
                            onClick={handlePlayToggle}
                            disabled={station.status !== 'online'}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-xl disabled:opacity-40 disabled:pointer-events-none ${
                                isPlaying
                                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30'
                            }`}
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 fill-current" />
                            ) : (
                                <Play className="w-8 h-8 fill-current ml-1" />
                            )}
                        </button>

                        {/* CSS Visualizer Wave */}
                        {isPlaying && (
                            <div className="flex items-center gap-1 h-6 py-1 select-none">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                    <div
                                        key={i}
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                        className="w-1 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Volume controls */}
                        <div className="w-full flex items-center gap-3 mt-2">
                            <button onClick={handleMuteToggle} className="text-slate-400 hover:text-white transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    setVolume(parseFloat(e.target.value));
                                    setIsMuted(false);
                                }}
                                className="flex-1 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer / Powered By */}
            <footer className="w-full py-4 text-center border-t border-slate-900/60 bg-slate-950/40 relative z-20">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    Powered by <Shield className="w-3 h-3 text-indigo-500" /> {app.name}
                </span>
            </footer>
        </div>
    );
}
