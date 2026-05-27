import { createPlayer } from '@videojs/react';
import {
    liveAudioFeatures,
    LiveAudioSkin,
    Audio,
} from '@videojs/react/live-audio';
import {
    liveVideoFeatures,
    LiveVideoSkin,
    Video,
} from '@videojs/react/live-video';
import '@videojs/react/live-audio/skin.css';
import '@videojs/react/live-video/skin.css';
import { Loader2, Radio, Tv } from 'lucide-react';
import { useState, useEffect } from 'react';

const VideoPlayer = createPlayer({ features: liveVideoFeatures, displayName: 'TuiStreamVideo' });
const AudioPlayer = createPlayer({ features: liveAudioFeatures, displayName: 'TuiStreamAudio' });

interface Props {
    src: string;
    type: 'audio' | 'video';
    title?: string;
}

function VideoStatusOverlay({ title, onError }: { title?: string; onError?: () => void }) {
    const buffering = VideoPlayer.usePlayer((s: any) => s.buffering);
    const error = VideoPlayer.usePlayer((s: any) => s.error);

    useEffect(() => {
        if (error && onError) {
            onError();
        }
    }, [error]);

    return (
        <>
            {title && (
                <div className="px-4 pt-2 pb-1 bg-slate-950/60 backdrop-blur-xs absolute top-0 left-0 right-0 z-10">
                    <p className="text-xs font-semibold text-slate-400 truncate">{title}</p>
                </div>
            )}
            {buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10 pointer-events-none">
                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 pointer-events-none">
                    <div className="text-center p-4">
                        <p className="text-sm font-bold text-red-400">Error de reproducción</p>
                        <p className="text-xs text-slate-500 mt-1">{error.message || 'No se pudo parsear el flujo del stream'}</p>
                    </div>
                </div>
            )}
        </>
    );
}

function AudioStatusOverlay({ title, onError }: { title?: string; onError?: () => void }) {
    const buffering = AudioPlayer.usePlayer((s: any) => s.buffering);
    const error = AudioPlayer.usePlayer((s: any) => s.error);

    useEffect(() => {
        if (error && onError) {
            onError();
        }
    }, [error]);

    return (
        <>
            {title && (
                <div className="px-4 pt-2 pb-1 bg-slate-950/60 backdrop-blur-xs">
                    <p className="text-xs font-semibold text-slate-400 truncate">{title}</p>
                </div>
            )}
            {buffering && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buffering...</span>
                </div>
            )}
            {error && (
                <div className="px-4 py-2 text-xs text-red-400">
                    <span className="font-bold">Error:</span> {error.message || 'No se pudo parsear el flujo de audio'}
                </div>
            )}
        </>
    );
}

export default function VideoJSReactPlayer({ src, type, title }: Props) {
    const [hasError, setHasError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [countdown, setCountdown] = useState(15);

    // Reset error when src changes
    useEffect(() => {
        setHasError(false);
        setCountdown(15);
    }, [src]);

    // Handle retry countdown
    useEffect(() => {
        if (!hasError) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Trigger retry by incrementing key and resetting error state
                    setRetryKey((key) => key + 1);
                    setHasError(false);
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasError]);

    const handleError = () => {
        setHasError(true);
        setCountdown(15);
    };

    if (hasError) {
        return (
            <div className="w-full aspect-video rounded-xl bg-slate-950/90 border border-slate-900/60 p-6 flex flex-col items-center justify-center text-center select-none animate-pulse">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border mb-3 ${
                    type === 'video' 
                        ? 'bg-pink-500/10 border-pink-500/20 text-pink-500' 
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'
                }`}>
                    {type === 'video' ? <Tv className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-widest uppercase">
                    ESPERANDO SEÑAL DE TRANSMISIÓN
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                    El codificador aún no ha enviado señal válida para parsear. Conectando de nuevo en {countdown}s...
                </p>
                <button
                    onClick={() => {
                        setRetryKey((k) => k + 1);
                        setHasError(false);
                    }}
                    className={`mt-4 px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all shadow-md active:scale-95 ${
                        type === 'video' 
                            ? 'bg-pink-500 hover:bg-pink-650' 
                            : 'bg-indigo-500 hover:bg-indigo-650'
                    }`}
                >
                    Conectar Ahora
                </button>
            </div>
        );
    }

    if (type === 'video') {
        return (
            <VideoPlayer.Provider key={`video-${retryKey}`}>
                <div className="relative rounded-xl overflow-hidden bg-slate-950 w-full h-full">
                    <VideoStatusOverlay title={title} onError={handleError} />
                    <LiveVideoSkin>
                        <Video src={src} />
                    </LiveVideoSkin>
                </div>
            </VideoPlayer.Provider>
        );
    }

    return (
        <AudioPlayer.Provider key={`audio-${retryKey}`}>
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-900 w-full">
                <AudioStatusOverlay title={title} onError={handleError} />
                <LiveAudioSkin>
                    <Audio src={src} />
                </LiveAudioSkin>
            </div>
        </AudioPlayer.Provider>
    );
}
