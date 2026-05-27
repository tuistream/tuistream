import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    Disc3, Play, Pause, SkipForward, SkipBack, Volume2,
    Music, Mic, Users, Radio, ListMusic, Shuffle, Repeat,
    Power, RefreshCw, Sliders, ChevronLeft, ArrowUpDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from './Layout';

interface Track {
    id: number;
    title: string;
    artist: string;
    duration: number;
    filename: string;
}
interface Station {
    id: number;
    name: string;
    status: string;
    listeners: number;
    current_song: string;
    autodj_service: string;
    bitrate: number;
    port: number;
}
interface Playlist {
    id: number;
    name: string;
    tracks_count: number;
}

function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function WebDJ() {
    const { station, playlists: initialPlaylists, queue: initialQueue } = usePage<any>().props as {
        station: Station;
        playlists: Playlist[];
        queue: Track[];
    };

    const [queue, setQueue] = useState<Track[]>(initialQueue || []);
    const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists || []);
    const [activePlaylist, setActivePlaylist] = useState<number | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(station.status === 'online');
    const [volume, setVolume] = useState(80);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [crossfade, setCrossfade] = useState(3);
    const [listeners, setListeners] = useState(station.listeners);
    const [currentSong, setCurrentSong] = useState(station.current_song || '—');
    const [activeTab, setActiveTab] = useState<'queue' | 'playlists'>('queue');
    const [dragging, setDragging] = useState<number | null>(null);

    const currentTrack = queue[currentIdx] ?? null;

    // Poll live stats every 5s
    useEffect(() => {
        const t = setInterval(() => {
            fetch(`/admin/webdj/${station.id}/stats`)
                .then(r => r.json())
                .then(d => {
                    setListeners(d.listeners ?? listeners);
                    setCurrentSong(d.current_song ?? currentSong);
                })
                .catch(() => {});
        }, 5000);
        return () => clearInterval(t);
    }, [station.id]);

    const sendCommand = (action: string, payload: object = {}) => {
        fetch(`/admin/webdj/${station.id}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '' },
            body: JSON.stringify({ action, ...payload }),
        }).catch(() => {});
    };

    const handlePlay = () => { sendCommand('play'); setIsPlaying(true); };
    const handlePause = () => { sendCommand('pause'); setIsPlaying(false); };
    const handleNext = () => {
        let next = isShuffle ? Math.floor(Math.random() * queue.length) : (currentIdx + 1) % queue.length;
        setCurrentIdx(next);
        sendCommand('skip', { track_id: queue[next]?.id });
    };
    const handlePrev = () => {
        let prev = (currentIdx - 1 + queue.length) % queue.length;
        setCurrentIdx(prev);
        sendCommand('skip', { track_id: queue[prev]?.id });
    };
    const handleSkipTo = (idx: number) => {
        setCurrentIdx(idx);
        sendCommand('skip', { track_id: queue[idx]?.id });
    };
    const handleVolumeChange = (v: number) => {
        setVolume(v);
        sendCommand('volume', { level: v });
    };
    const handleLoadPlaylist = (playlistId: number) => {
        fetch(`/admin/webdj/${station.id}/playlist/${playlistId}/tracks`)
            .then(r => r.json())
            .then(tracks => {
                setQueue(tracks);
                setCurrentIdx(0);
                setActivePlaylist(playlistId);
                sendCommand('load_playlist', { playlist_id: playlistId });
            });
    };
    const removeFromQueue = (idx: number) => {
        const t = [...queue];
        t.splice(idx, 1);
        setQueue(t);
    };
    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const t = [...queue];
        [t[idx - 1], t[idx]] = [t[idx], t[idx - 1]];
        setQueue(t);
    };

    const btnClass = 'p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all';
    const activeBtnClass = 'p-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 transition-all';

    return (
        <AdminLayout currentPage="audio">
            <Head title={`Web DJ — ${station.name}`} />

            <div className="mb-6">
                <Link href="/admin/audio" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold">
                    <ChevronLeft className="w-3.5 h-3.5" /> Volver a Audio
                </Link>
            </div>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                    <Disc3 className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Web DJ</h1>
                    <p className="text-sm text-slate-500">{station.name} — Control remoto del AutoDJ</p>
                </div>

                {/* Live status */}
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Oyentes</p>
                        <p className="text-xl font-black text-white font-mono">{listeners.toLocaleString()}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
                        station.status === 'online'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${station.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                        {station.status === 'online' ? 'EN VIVO' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── DJ Console ──────────────────────────────── */}
                <div className="xl:col-span-2 space-y-4">

                    {/* Now Playing */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                        <div className="flex items-center gap-4">
                            {/* Album art placeholder */}
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Music className="w-8 h-8 text-purple-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Reproduciendo ahora</p>
                                <p className="text-lg font-black text-white truncate">
                                    {currentTrack?.title ?? currentSong}
                                </p>
                                <p className="text-sm text-slate-400 truncate">
                                    {currentTrack?.artist ?? station.name}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-mono text-slate-600">{station.bitrate} kbps</span>
                                    <span className="text-[10px] text-slate-700">·</span>
                                    <span className="text-[10px] font-mono text-slate-600">:{station.port}</span>
                                    {currentTrack?.duration && (
                                        <span className="text-[10px] font-mono text-slate-600 ml-auto">{formatTime(currentTrack.duration)}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar (decorative — controlled by AutoDJ) */}
                        <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-2/5 transition-all" />
                        </div>

                        {/* Transport Controls */}
                        <div className="flex items-center justify-center gap-3 mt-5">
                            <button onClick={() => setIsShuffle(!isShuffle)} className={isShuffle ? activeBtnClass : btnClass} title="Aleatorio">
                                <Shuffle className="w-4 h-4" />
                            </button>
                            <button onClick={handlePrev} className={btnClass} title="Anterior">
                                <SkipBack className="w-5 h-5" />
                            </button>

                            {/* Main Play/Pause */}
                            <button
                                onClick={isPlaying ? handlePause : handlePlay}
                                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 hover:scale-105 transition-all"
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </button>

                            <button onClick={handleNext} className={btnClass} title="Siguiente">
                                <SkipForward className="w-5 h-5" />
                            </button>
                            <button onClick={() => setIsRepeat(!isRepeat)} className={isRepeat ? activeBtnClass : btnClass} title="Repetir">
                                <Repeat className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Volume + Crossfade */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-5">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                                    <Volume2 className="w-3 h-3 inline mr-1" />
                                    Volumen — <span className="text-indigo-400 font-mono">{volume}%</span>
                                </label>
                                <input type="range" min={0} max={100} value={volume}
                                    onChange={e => handleVolumeChange(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-purple-500 cursor-pointer" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                                    <Sliders className="w-3 h-3 inline mr-1" />
                                    Crossfade — <span className="text-indigo-400 font-mono">{crossfade}s</span>
                                </label>
                                <input type="range" min={0} max={10} value={crossfade}
                                    onChange={e => { setCrossfade(parseInt(e.target.value)); sendCommand('crossfade', { seconds: parseInt(e.target.value) }); }}
                                    className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-purple-500 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Reiniciar AutoDJ', icon: RefreshCw, action: 'restart_autodj', cls: 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10' },
                            { label: 'Detener Stream',   icon: Power,      action: 'stop',           cls: 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10' },
                            { label: 'Activar Mic',      icon: Mic,        action: 'mic_on',         cls: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10' },
                        ].map(a => (
                            <button key={a.action} onClick={() => sendCommand(a.action)}
                                className={`py-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-2 transition-all ${a.cls}`}>
                                <a.icon className="w-4 h-4" /> {a.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Queue & Playlists ──────────────────────── */}
                <div className="xl:col-span-1">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden h-full">

                        {/* Tabs */}
                        <div className="flex border-b border-slate-900">
                            {[{ key: 'queue', label: 'Cola', icon: ListMusic }, { key: 'playlists', label: 'Playlists', icon: Music }].map(t => (
                                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                                    className={`flex-1 py-3 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                                        activeTab === t.key
                                            ? 'text-indigo-400 border-b-2 border-indigo-500'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}>
                                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-[500px] overflow-y-auto">
                            {activeTab === 'queue' ? (
                                queue.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ListMusic className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                                        <p className="text-slate-600 text-xs">Cola vacía</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-900/50">
                                        {queue.map((track, idx) => (
                                            <div key={track.id}
                                                className={`flex items-center gap-2 px-4 py-2.5 hover:bg-slate-900/30 transition-all cursor-pointer ${idx === currentIdx ? 'bg-purple-500/5 border-l-2 border-purple-500' : ''}`}
                                                onClick={() => handleSkipTo(idx)}
                                            >
                                                <span className="text-[10px] font-mono text-slate-600 w-5 text-center shrink-0">{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[11px] font-bold truncate ${idx === currentIdx ? 'text-purple-400' : 'text-slate-300'}`}>{track.title}</p>
                                                    <p className="text-[10px] text-slate-600 truncate">{track.artist}</p>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-600 shrink-0">{formatTime(track.duration)}</span>
                                                <button onClick={e => { e.stopPropagation(); moveUp(idx); }}
                                                    className="p-1 hover:text-indigo-400 text-slate-700 transition-all">
                                                    <ArrowUpDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="divide-y divide-slate-900/50">
                                    {playlists.map(pl => (
                                        <button key={pl.id} onClick={() => handleLoadPlaylist(pl.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/30 transition-all text-left ${activePlaylist === pl.id ? 'bg-purple-500/5' : ''}`}>
                                            <div className={`p-2 rounded-lg ${activePlaylist === pl.id ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-900 text-slate-500'}`}>
                                                <ListMusic className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-300 truncate">{pl.name}</p>
                                                <p className="text-[10px] text-slate-600">{pl.tracks_count} canciones</p>
                                            </div>
                                            {activePlaylist === pl.id && (
                                                <span className="text-[10px] text-purple-400 font-bold">Activa</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
