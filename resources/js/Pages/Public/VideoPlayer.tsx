import { Head } from '@inertiajs/react';
import { Radio, Shield, Tv, AlertCircle } from 'lucide-react';
import VideoJSReactPlayer from '@/Components/Players/VideoJSReactPlayer';
import { useEffect, useState } from 'react';

interface Props {
    station: {
        id: number;
        name: string;
        slug: string;
        status: string;
        port: number;
        now_playing: string;
        hls_url: string;
        stream_url: string;
    };
    app: {
        logo: string;
        favicon: string;
        name: string;
    };
    videoPlayerSettings?: {
        default_video_player: string;
        enable_videojs: boolean;
        enable_clappr: boolean;
        enable_html5_generic: boolean;
        default_audio_player_iframe: string;
        default_video_player_iframe: string;
    };
}

export default function VideoPlayer({ station, app, videoPlayerSettings }: Props) {
    const settings = videoPlayerSettings || {
        default_video_player: 'videojs',
        enable_videojs: true,
        enable_clappr: false,
        enable_html5_generic: true,
    };

    // Calculate active selected player with safe fallbacks
    let selectedPlayer = settings.default_video_player;
    if (selectedPlayer === 'videojs' && !settings.enable_videojs) {
        selectedPlayer = settings.enable_html5_generic ? 'html5_generic' : (settings.enable_clappr ? 'clappr' : 'videojs');
    } else if (selectedPlayer === 'clappr' && !settings.enable_clappr) {
        selectedPlayer = settings.enable_videojs ? 'videojs' : (settings.enable_html5_generic ? 'html5_generic' : 'clappr');
    } else if (selectedPlayer === 'html5_generic' && !settings.enable_html5_generic) {
        selectedPlayer = settings.enable_videojs ? 'videojs' : (settings.enable_clappr ? 'clappr' : 'html5_generic');
    }

    // Load Clappr CDN script dynamically if selected
    useEffect(() => {
        let script: HTMLScriptElement | null = null;
        if (selectedPlayer === 'clappr' && station.status === 'online') {
            script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js';
            script.async = true;
            script.onload = () => {
                const Clappr = (window as any).Clappr;
                if (Clappr) {
                    const playerContainer = document.getElementById('clappr-player');
                    if (playerContainer) {
                        playerContainer.innerHTML = '';
                        new Clappr.Player({
                            source: station.hls_url || station.stream_url,
                            parentId: '#clappr-player',
                            width: '100%',
                            height: '100%',
                            autoPlay: true,
                            mute: false,
                        });
                    }
                }
            };
            document.body.appendChild(script);
        }
        return () => {
            if (script) {
                document.body.removeChild(script);
            }
        };
    }, [selectedPlayer, station.status, station.hls_url, station.stream_url]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden relative">
            <Head title={`${station.name} - En Vivo`} />

            {/* Ambient Background Lights */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="w-full py-4 px-6 border-b border-slate-900/60 backdrop-blur-md bg-slate-950/40 relative z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {app.logo ? (
                        <img src={app.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900/50 p-0.5 border border-slate-800" />
                    ) : (
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-violet-600 rounded-xl text-white shadow-lg">
                            <Tv className="w-4 h-4" />
                        </div>
                    )}
                    <span className="font-bold text-sm tracking-wider text-slate-200 uppercase">{app.name}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                        station.status === 'online'
                            ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${station.status === 'online' ? 'bg-pink-400 animate-pulse' : 'bg-slate-500'}`} />
                        {station.status === 'online' ? 'Transmisión En Vivo' : 'Fuera de Línea'}
                    </span>
                </div>
            </header>

            {/* Central Video Player Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
                {/* Station Info Top */}
                <div className="w-full flex items-center justify-between mb-4 px-2">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse inline-block" />
                            {station.name}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                            Canal de Televisión Digital · Reproductor: <span className="text-indigo-400 font-extrabold">{
                                selectedPlayer === 'videojs' ? 'Video.js Moderno' : (selectedPlayer === 'clappr' ? 'Clappr Extensible' : 'HTML5 Nativo')
                            }</span>
                        </p>
                    </div>
                </div>

                {/* Player Frame Card */}
                <div className="w-full aspect-video rounded-3xl border border-slate-900 bg-slate-900/10 p-2 backdrop-blur-md shadow-2xl overflow-hidden relative group">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center relative">
                        {station.status !== 'online' ? (
                            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 select-none text-center">
                                <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20 mb-4 animate-pulse">
                                    <Tv className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">FUERA DE LÍNEA</h3>
                                <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">Este canal no está transmitiendo señal en este momento. Por favor regrese más tarde.</p>
                            </div>
                        ) : (
                            <div className="w-full h-full">
                                {selectedPlayer === 'videojs' && (
                                    <VideoJSReactPlayer
                                        src={station.hls_url || station.stream_url}
                                        type="video"
                                        title={station.name}
                                    />
                                )}
                                {selectedPlayer === 'clappr' && (
                                    <div id="clappr-player" className="w-full h-full flex items-center justify-center bg-black" />
                                )}
                                {selectedPlayer === 'html5_generic' && (
                                    <video 
                                        src={station.hls_url || station.stream_url} 
                                        controls 
                                        autoPlay 
                                        className="w-full h-full object-contain bg-black"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stream Info Description Box */}
                {station.status === 'online' && (
                    <div className="w-full mt-6 bg-slate-900/30 border border-slate-900/60 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
                        <AlertCircle className="w-5 h-5 text-pink-500 shrink-0" />
                        <span className="text-xs text-slate-400 leading-relaxed">
                            <strong>Transmisión activa:</strong> Estás visualizando la señal oficial en alta definición ({station.now_playing}). Si experimentas pausas, recarga la página o verifica tu conexión a internet.
                        </span>
                    </div>
                )}
            </main>

            {/* Footer / Powered By */}
            <footer className="w-full py-4 text-center border-t border-slate-900/60 bg-slate-950/40 relative z-20">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                    Powered by <Shield className="w-3 h-3 text-pink-500" /> {app.name}
                </span>
            </footer>
        </div>
    );
}
