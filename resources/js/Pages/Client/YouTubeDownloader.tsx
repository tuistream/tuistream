import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Youtube, Download, Music, Video, Search, Loader2,
    CheckCircle, XCircle, Clock, List, ArrowLeft, HelpCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import StationLayout from './StationLayout';
import VideoStationLayout from './VideoStation/Layout';

interface Station {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    status: string;
}

interface Playlist {
    id: number;
    name: string;
}

interface DownloadJob {
    id: string;
    url: string;
    title: string;
    format: string;
    quality: string;
    station_name: string;
    status: 'pending' | 'downloading' | 'done' | 'error';
    progress: number;
    error?: string;
    created_at: string;
}

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none';

function StatusBadge({ status, progress }: { status: DownloadJob['status']; progress: number }) {
    const map = {
        pending:     { label: 'En cola',     cls: 'text-slate-400 bg-slate-900 border-slate-800',       icon: Clock },
        downloading: { label: `${progress}%`, cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: Loader2 },
        done:        { label: 'Completado', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
        error:       { label: 'Error',      cls: 'text-red-400 bg-red-500/10 border-red-500/20',        icon: XCircle },
    };
    const { label, cls, icon: Icon } = map[status];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cls}`}>
            <Icon className={`w-3.5 h-3.5 ${status === 'downloading' ? 'animate-spin' : ''}`} />
            {label}
        </span>
    );
}

export default function YouTubeDownloader() {
    const { station, playlists = [], jobs: initialJobs = [] } = usePage<any>().props as {
        station: Station;
        playlists: Playlist[];
        jobs: DownloadJob[];
    };

    const [jobs, setJobs] = useState<DownloadJob[]>(initialJobs);
    const [youtubeInfo, setYoutubeInfo] = useState<{ title?: string; thumbnail?: string } | null>(null);
    const [resolving, setResolving] = useState(false);

    const isAudio = station.type === 'audio';

    const { data, setData, post, processing, reset, errors } = useForm({
        url: '',
        format: isAudio ? 'audio' : 'video', // lock format or default according to type
        quality: isAudio ? '192' : '720p',
        playlist: playlists.length > 0 ? playlists[0].name : 'default',
    });

    // Fetch video info on paste
    const fetchInfo = async (url: string) => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
        setResolving(true);
        setYoutubeInfo(null);
        try {
            // Using existing admin oembed helper endpoint for convenience and security
            const res = await fetch(`/admin/youtube-downloader/info?url=${encodeURIComponent(url)}`);
            if (res.ok) setYoutubeInfo(await res.json());
        } catch { /* silent */ }
        setResolving(false);
    };

    // Poll job progress every 3s
    useEffect(() => {
        const active = jobs.filter(j => j.status === 'downloading' || j.status === 'pending');
        if (!active.length) return;
        const t = setInterval(async () => {
            try {
                const res = await fetch(`/dashboard/station/${station.id}/youtube-downloader`);
                if (res.ok) {
                    const html = await res.text();
                    // Simple parse or just fetch json (Wait, we can fetch from admin jobs endpoint since it returns all jobs)
                    const apiRes = await fetch('/admin/youtube-downloader/jobs');
                    if (apiRes.ok) {
                        const allJobs = await apiRes.json();
                        const filtered = allJobs.filter((j: any) => String(j.station_id) === String(station.id));
                        setJobs(filtered);
                    }
                }
            } catch { /* silent */ }
        }, 3000);
        return () => clearInterval(t);
    }, [jobs, station.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/dashboard/station/${station.id}/youtube-downloader/download`, {
            onSuccess: () => {
                reset('url');
                setYoutubeInfo(null);
                // Refresh list
                fetch('/admin/youtube-downloader/jobs')
                    .then(r => r.json())
                    .then(allJobs => {
                        const filtered = allJobs.filter((j: any) => String(j.station_id) === String(station.id));
                        setJobs(filtered);
                    });
            },
        });
    };

    const audioQualities = [
        { value: '128', label: '128 kbps (Normal)' },
        { value: '192', label: '192 kbps (Alta)' },
        { value: '256', label: '256 kbps (Muy Alta)' },
        { value: '320', label: '320 kbps (Estudio)' },
    ];
    const videoQualities = [
        { value: '360p', label: '360p (Baja)' },
        { value: '480p', label: '480p (SD)' },
        { value: '720p', label: '720p (HD)' },
        { value: '1080p', label: '1080p (Full HD)' },
    ];

    const LayoutComponent = isAudio ? StationLayout : VideoStationLayout;

    return (
        <LayoutComponent currentSection="youtube">
            <Head title={`YouTube Downloader — ${station.name}`} />

            <div className="flex items-center gap-3 mb-8">
                <div className={`p-2.5 rounded-xl border ${
                    isAudio 
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                }`}>
                    <Youtube className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">YouTube Downloader</h1>
                    <p className="text-sm text-slate-500 mt-1">Descarga videos y música directamente a la biblioteca de tu estación en la nube</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ─── Form ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xs p-6 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-${isAudio ? 'indigo' : 'pink'}-500/30 to-transparent`} />

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* URL */}
                            <div>
                                <label className={labelClass}>Enlace del Video de YouTube <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={data.url}
                                        onChange={e => { setData('url', e.target.value); fetchInfo(e.target.value); }}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className={inputClass + ' pr-10'}
                                        required
                                    />
                                    {resolving
                                        ? <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 animate-spin" />
                                        : <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-600" />
                                    }
                                </div>
                                {errors.url && <p className="text-[10px] text-red-400 mt-1">{errors.url}</p>}
                            </div>

                            {/* Video Preview */}
                            {youtubeInfo?.title && (
                                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-900 rounded-xl">
                                    {youtubeInfo.thumbnail && (
                                        <img src={youtubeInfo.thumbnail} alt="thumb" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{youtubeInfo.title}</p>
                                        <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Enlace válido
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Format toggle */}
                            <div>
                                <label className={labelClass}>Formato de salida</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'audio', label: 'Audio (MP3)', icon: Music, allowed: true },
                                        { value: 'video', label: 'Video (MP4)', icon: Video, allowed: station.type === 'video' },
                                    ].map(f => {
                                        if (!f.allowed) return null;
                                        return (
                                            <button key={f.value} type="button"
                                                onClick={() => { setData(d => ({ ...d, format: f.value, quality: f.value === 'audio' ? '192' : '720p' })); }}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                                                    data.format === f.value
                                                        ? isAudio
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                            : 'bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-600/20'
                                                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                                                }`}
                                            >
                                                <f.icon className="w-3.5 h-3.5" /> {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quality */}
                            <div>
                                <label className={labelClass}>Calidad de Descarga</label>
                                <select value={data.quality} onChange={e => setData('quality', e.target.value)} className={selectClass}>
                                    {(data.format === 'audio' ? audioQualities : videoQualities).map(q => (
                                        <option key={q.value} value={q.value}>{q.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Playlist Target */}
                            <div>
                                <label className={labelClass}>Añadir a Playlist (AutoDJ)</label>
                                <select value={data.playlist} onChange={e => setData('playlist', e.target.value)} className={selectClass}>
                                    {playlists.length === 0 ? (
                                        <option value="default">Playlist Principal (Auto-creada)</option>
                                    ) : (
                                        playlists.map(pl => (
                                            <option key={pl.id} value={pl.name}>{pl.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <button type="submit" disabled={processing || !data.url}
                                className={`w-full py-3 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg transform hover:-translate-y-0.5 ${
                                    isAudio
                                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                        : 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/20'
                                } disabled:opacity-50`}>
                                {processing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Encolando descarga...</>
                                    : <><Download className="w-4 h-4" /> Iniciar descarga</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ─── Jobs Queue ─────────────────────────────── */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
                            <List className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cola de Descargas de la Estación</h2>
                            <span className="ml-auto text-[10px] text-slate-650 font-mono">{jobs.length} tareas</span>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="text-center py-16">
                                <Youtube className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-semibold">Sin descargas aún</p>
                                <p className="text-slate-650 text-xs mt-1">Ingresa un enlace de YouTube para agregarlo a la biblioteca</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-900/40">
                                {jobs.map(job => (
                                    <div key={job.id} className="p-4 hover:bg-slate-900/10 transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg mt-0.5 ${
                                                job.format === 'video' ? 'bg-pink-500/10 text-pink-400' : 'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                                {job.format === 'video' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-200 truncate">{job.title || job.url}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusBadge status={job.status} progress={job.progress} />
                                                    <span className="text-[10px] text-slate-650 font-mono">{job.quality}</span>
                                                    <span className="text-[10px] text-slate-650 font-mono ml-auto">{job.created_at}</span>
                                                </div>

                                                {/* Error report */}
                                                {job.status === 'error' && job.error && (
                                                    <p className="text-[10px] text-red-400/90 mt-2 bg-red-950/20 border border-red-900/30 rounded-lg p-2 font-mono whitespace-pre-wrap">
                                                        {job.error}
                                                    </p>
                                                )}

                                                {/* Downloading bar */}
                                                {job.status === 'downloading' && (
                                                    <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-900/50">
                                                        <div
                                                            className={`h-full transition-all duration-300 rounded-full ${
                                                                isAudio ? 'bg-indigo-500' : 'bg-pink-500'
                                                            }`}
                                                            style={{ width: `${job.progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </LayoutComponent>
    );
}
