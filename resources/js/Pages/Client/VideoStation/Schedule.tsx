import { useEffect, useState, useCallback, useRef } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import { Calendar, Trash2, Play, Pause, Film, Save, AlertCircle, Plus, Clock, ArrowUp, ArrowDown, Repeat, StepForward, StepBack, Share2, Tv } from 'lucide-react';
import VideoStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface ScheduleItem {
    id: number;
    video_id: number;
    position: number;
    video_title: string;
    video_filename: string;
    duration: number;
    video_url?: string;
}

interface VideoItem {
    id: number;
    title: string;
    duration: number;
    filename: string;
    url?: string;
}

interface StreamTarget {
    platform: string;
    name: string;
    key: string;
    url: string;
    enabled: boolean;
}

export default function VideoStationSchedule() {
    const { station } = usePage<any>().props as any;
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [showAddVideo, setShowAddVideo] = useState(false);
    const [showStreamTargets, setShowStreamTargets] = useState(false);

    // Player state
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loop, setLoop] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const api = `/dashboard/canaltv/${station.id}`;

    const loadAll = useCallback(() => {
        setLoading(true);
        Promise.all([
            fetch(`${api}/schedule/list`, { headers: apiHeaders() }).then(r => r.json()),
            fetch(`${api}/media/list`, { headers: apiHeaders() }).then(r => r.json()),
        ])
            .then(([schedData, mediaData]) => {
                const sched = (schedData.schedule || []).map((s: any) => ({
                    ...s,
                    video_url: `/storage/${s.video_filepath || 'media/' + s.video_filename}`,
                }));
                setSchedule(sched);
                setVideos((mediaData.videos || []).map((v: any) => ({
                    ...v,
                    url: `/storage/${v.filepath || 'media/' + v.filename}`,
                })));
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al cargar datos' }))
            .finally(() => setLoading(false));
    }, [api]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Player logic
    const playVideo = (index: number) => {
        if (index < 0 || index >= schedule.length) return;
        setCurrentIndex(index);
        setIsPlaying(true);
    };

    const stopVideo = () => {
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current || currentIndex === -1) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const nextVideo = () => {
        if (schedule.length === 0) return;
        const next = (currentIndex + 1) % schedule.length;
        playVideo(next);
    };

    const prevVideo = () => {
        if (schedule.length === 0) return;
        const prev = currentIndex <= 0 ? schedule.length - 1 : currentIndex - 1;
        playVideo(prev);
    };

    const onVideoEnded = () => {
        if (loop) {
            playVideo(currentIndex);
        } else if (currentIndex < schedule.length - 1) {
            playVideo(currentIndex + 1);
        } else {
            setIsPlaying(false);
            setCurrentIndex(-1);
        }
    };

    useEffect(() => {
        if (videoRef.current && isPlaying && currentIndex >= 0) {
            videoRef.current.load();
            videoRef.current.play().catch(() => {});
        }
    }, [currentIndex, isPlaying]);

    const addToSchedule = (video: VideoItem) => {
        fetch(`${api}/schedule/add`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: video.id }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) { loadAll(); setShowAddVideo(false); setMessage({ type: 'success', text: `"${video.title}" agregado.` }); }
                else setMessage({ type: 'error', text: d.message || 'Error' });
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }));
    };

    const removeFromSchedule = (item: ScheduleItem) => {
        fetch(`${api}/schedule/remove`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule_id: item.id }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    if (currentIndex >= schedule.length - 1) { stopVideo(); }
                    loadAll();
                    setMessage({ type: 'success', text: 'Removido de la programación.' });
                }
            });
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newSchedule = [...schedule];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSchedule.length) return;
        [newSchedule[index], newSchedule[targetIndex]] = [newSchedule[targetIndex], newSchedule[index]];
        setSchedule(newSchedule);
    };

    const saveOrder = () => {
        setSaving(true);
        const positions = schedule.map((item, idx) => ({ id: item.id, position: idx }));
        fetch(`${api}/schedule/reorder`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ positions }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setMessage({ type: 'success', text: 'Orden y programación guardados.' });
                    if (schedule.length > 0 && !isPlaying) {
                        playVideo(0);
                    }
                }
                else setMessage({ type: 'error', text: 'Error al guardar orden' });
            })
            .finally(() => setSaving(false));
    };

    const currentVideo = currentIndex >= 0 ? schedule[currentIndex] : null;
    const totalDuration = schedule.reduce((acc, s) => acc + (s.duration || 0), 0);
    const formatDuration = (s: number) => {
        if (!s) return '--:--';
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    const formatTotal = (s: number) => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    const availableVideos = videos.filter(v => !schedule.some(s => s.video_id === v.id));

    // Stream Targets data
    const streamTargets: StreamTarget[] = [
        { platform: 'youtube', name: 'YouTube Live', key: station.youtube_key || '', url: 'rtmp://a.rtmp.youtube.com/live2', enabled: !!station.youtube_enabled },
        { platform: 'facebook', name: 'Facebook Live', key: station.facebook_key || '', url: 'rtmps://live-api-s.facebook.com:443/rtmp/', enabled: !!station.facebook_enabled },
        { platform: 'twitch', name: 'Twitch', key: station.twitch_key || '', url: 'rtmp://live.twitch.tv/app/', enabled: !!station.twitch_enabled },
        { platform: 'custom', name: ' Servidor RTMP Personalizado', key: station.custom_rtmp_key || '', url: station.custom_rtmp_url || 'rtmp://', enabled: !!station.custom_rtmp_enabled },
    ];

    return (
        <VideoStationLayout currentSection="schedule">
            <Head title={`${station.name} - Programación TV`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl"><Calendar className="w-4 h-4" /></div>
                        Programación TV
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {schedule.length} video(s) — {formatTotal(totalDuration)} total
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowStreamTargets(true)}
                        className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <Share2 className="w-3.5 h-3.5" /> Stream Targets
                    </button>
                    <button onClick={() => setShowAddVideo(true)} disabled={availableVideos.length === 0}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Agregar Video
                    </button>
                    <button onClick={saveOrder} disabled={saving || schedule.length === 0}
                        className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar Programación'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-xl border text-xs font-medium ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>{message.text}</div>
            )}

            {/* ── Reproductor de Video ── */}
            {schedule.length > 0 && (
                <div className="mb-6 rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                    <div className="p-3 border-b border-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Tv className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Reproductor TV</h3>
                            {currentVideo && (
                                <span className="text-[10px] text-slate-500 font-mono ml-2">
                                    [{currentIndex + 1}/{schedule.length}] {currentVideo.video_title}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded accent-pink-500" />
                                <span className={`text-[10px] font-bold ${loop ? 'text-pink-400' : 'text-slate-500'}`}>
                                    <Repeat className="w-3 h-3 inline mr-0.5" /> Bucle
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="aspect-video bg-black relative">
                        {currentVideo ? (
                            <video
                                ref={videoRef}
                                src={currentVideo.video_url}
                                className="w-full h-full object-contain"
                                onEnded={onVideoEnded}
                                playsInline
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-950">
                                <div className="text-center">
                                    <Play className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                                    <p className="text-xs text-slate-600">Selecciona un video de la programación para reproducir</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-900 flex items-center justify-center gap-2">
                        <button onClick={prevVideo} disabled={schedule.length === 0}
                            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-400 hover:text-white transition-all"
                            title="Anterior">
                            <StepBack className="w-4 h-4" />
                        </button>
                        <button onClick={togglePlayPause} disabled={currentIndex === -1}
                            className="p-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-30 rounded-xl text-white transition-all shadow-lg shadow-pink-500/20"
                            title={isPlaying ? 'Pausar' : 'Reproducir'}>
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button onClick={stopVideo} disabled={currentIndex === -1}
                            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                            title="Detener">
                            <div className="w-4 h-4 bg-red-400 rounded-sm" />
                        </button>
                        <button onClick={nextVideo} disabled={schedule.length === 0}
                            className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-400 hover:text-white transition-all"
                            title="Siguiente">
                            <StepForward className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Lista de Programación ── */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                <div className="p-4 border-b border-slate-900 flex items-center gap-2">
                    <Film className="w-4 h-4 text-pink-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Lista de Reproducción TV</h3>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-500">Cargando...</div>
                ) : schedule.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                        <p className="text-sm font-bold">Programación vacía</p>
                        <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">Agrega videos desde tu biblioteca de Medios para crear la parrilla de programación de tu canal.</p>
                        <button onClick={() => setShowAddVideo(true)} disabled={availableVideos.length === 0}
                            className="mt-4 px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl text-xs font-bold hover:bg-pink-500/20 transition-all inline-flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Agregar Video
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-900/50">
                        {schedule.map((item, idx) => (
                            <div key={item.id}
                                onClick={() => playVideo(idx)}
                                className={`flex items-center p-3 hover:bg-slate-950/50 transition-all group cursor-pointer ${
                                    currentIndex === idx ? 'bg-pink-500/5 border-l-2 border-l-pink-500' : ''
                                }`}>
                                <div className="flex items-center gap-2 shrink-0 mr-3" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 'up'); }} disabled={idx === 0}
                                        className="p-1 text-slate-600 hover:text-white disabled:opacity-30 transition-colors" title="Mover arriba">
                                        <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); moveItem(idx, 'down'); }} disabled={idx === schedule.length - 1}
                                        className="p-1 text-slate-600 hover:text-white disabled:opacity-30 transition-colors" title="Mover abajo">
                                        <ArrowDown className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mr-3 text-[10px] font-bold ${
                                    currentIndex === idx ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                }`}>
                                    {currentIndex === idx && isPlaying ? <Play className="w-3 h-3" /> : idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold truncate ${currentIndex === idx ? 'text-white' : 'text-slate-300'}`}>{item.video_title}</p>
                                    <p className="text-[9px] text-slate-500 font-mono truncate">{item.video_filename}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                    <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(item.duration)}</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeFromSchedule(item); }}
                                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Agregar Video Modal ── */}
            {showAddVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900 shrink-0">
                            <h3 className="text-sm font-bold text-white">Agregar Video a Programación</h3>
                            <button onClick={() => setShowAddVideo(false)} className="text-slate-500 hover:text-white"><Plus className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            {availableVideos.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <Film className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                                    <p className="text-sm">No hay videos disponibles</p>
                                    <p className="text-[10px] text-slate-600 mt-1">Todos los videos ya están en la programación o no has subido ninguno.</p>
                                </div>
                            ) : (
                                availableVideos.map(v => (
                                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-pink-500/30 transition-all cursor-pointer"
                                        onClick={() => addToSchedule(v)}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400"><Play className="w-3.5 h-3.5" /></div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-300 truncate">{v.title}</p>
                                                <p className="text-[9px] text-slate-500 font-mono truncate">{v.filename}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono shrink-0">{formatDuration(v.duration)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stream Targets Modal ── */}
            {showStreamTargets && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900 shrink-0">
                            <div className="flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-sm font-bold text-white">Stream Targets</h3>
                            </div>
                            <button onClick={() => setShowStreamTargets(false)} className="text-slate-500 hover:text-white"><Plus className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                            <p className="text-[10px] text-slate-500 mb-2">Configura las plataformas donde compartir tu transmisión de video.</p>
                            {streamTargets.map(target => (
                                <div key={target.platform} className={`p-4 rounded-xl border ${target.enabled ? 'border-slate-800 bg-slate-950/50' : 'border-slate-900 bg-slate-950/20 opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-slate-300">{target.name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${target.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            {target.enabled ? 'HABILITADO' : 'DESHABILITADO'}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider">URL del Servidor</span>
                                            <p className="text-[10px] text-slate-400 font-mono bg-slate-900 p-1.5 rounded mt-0.5 truncate">{target.url}</p>
                                        </div>
                                        {target.enabled && (
                                            <div>
                                                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Stream Key</span>
                                                <p className="text-[10px] text-slate-400 font-mono bg-slate-900 p-1.5 rounded mt-0.5 truncate">{target.key || 'No configurada'}</p>
                                            </div>
                                        )}
                                    </div>
                                    {!target.enabled && (
                                        <p className="text-[10px] text-slate-600 mt-2">
                                            Habilita esta plataforma en{' '}
                                            <Link href={`/dashboard/canaltv/${station.id}/config`} className="text-pink-400 hover:underline">Configuración</Link>.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </VideoStationLayout>
    );
}
