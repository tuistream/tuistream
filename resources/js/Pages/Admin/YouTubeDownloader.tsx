import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Youtube, Download, Music, Video, Search, Loader2,
    CheckCircle, XCircle, Clock, Trash2, Radio, List
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from './Layout';

interface Station { id: number; name: string; type: string; }
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
const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none';

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
            <Icon className={`w-3 h-3 ${status === 'downloading' ? 'animate-spin' : ''}`} />
            {label}
        </span>
    );
}

export default function YouTubeDownloader() {
    const { stations, jobs: initialJobs = [], flash } = usePage<any>().props as { stations: Station[]; jobs: DownloadJob[]; flash?: { success?: string; error?: string } };
    const [jobs, setJobs] = useState<DownloadJob[]>(initialJobs);
    const [youtubeInfo, setYoutubeInfo] = useState<{ title?: string; thumbnail?: string } | null>(null);
    const [resolving, setResolving] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        url:        '',
        format:     'audio',   // audio | video
        quality:    '192',
        station_id: '',
        playlist:   'default',
    });

    // Fetch video info on paste
    const fetchInfo = async (url: string) => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;
        setResolving(true);
        setYoutubeInfo(null);
        try {
            const res = await fetch(`/admin/youtube-downloader/info?url=${encodeURIComponent(url)}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (res.ok) {
                const data = await res.json();
                setYoutubeInfo(data);
            }
        } catch { /* silent */ }
        setResolving(false);
    };

    // Poll job progress every 3s
    useEffect(() => {
        const active = jobs.filter(j => j.status === 'downloading' || j.status === 'pending');
        if (!active.length) return;
        const t = setInterval(async () => {
            try {
                const res = await fetch('/admin/youtube-downloader/jobs', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (res.ok) setJobs(await res.json());
            } catch { /* silent */ }
        }, 3000);
        return () => clearInterval(t);
    }, [jobs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/youtube-downloader/download', {
            onSuccess: () => {
                reset('url', 'quality');
                setYoutubeInfo(null);
                fetch('/admin/youtube-downloader/jobs', {
                    headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
                }).then(r => r.json()).then(setJobs).catch(() => {});
            },
        });
    };

    const audioQualities = [
        { value: '128', label: '128 kbps (Normal)' },
        { value: '192', label: '192 kbps (Alta)' },
        { value: '256', label: '256 kbps (Muy Alta)' },
        { value: '320', label: '320 kbps (Studio)' },
    ];
    const videoQualities = [
        { value: '360p', label: '360p' },
        { value: '480p', label: '480p (SD)' },
        { value: '720p', label: '720p (HD)' },
        { value: '1080p', label: '1080p (Full HD)' },
    ];

    return (
        <AdminLayout currentPage="youtube-downloader">
            <Head title="YouTube Downloader — TuiStream Admin" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                    <Youtube className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">YouTube Downloader</h1>
                    <p className="text-sm text-slate-500 mt-1">Descarga y convierte audio/video desde YouTube directamente a tus estaciones</p>
                </div>
            </div>

            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <span>⚠</span> {flash.error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ─── Form ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* URL */}
                            <div>
                                <label className={labelClass}>URL de YouTube <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <input
                                        type="url"
                                        value={data.url}
                                        onChange={e => { setData('url', e.target.value); fetchInfo(e.target.value); }}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className={inputClass + ' pr-10'}
                                        required
                                    />
                                    {resolving
                                        ? <Loader2 className="absolute right-3 top-3 w-4 h-4 text-slate-500 animate-spin" />
                                        : <Search className="absolute right-3 top-3 w-4 h-4 text-slate-600" />
                                    }
                                </div>
                                {errors.url && <p className="text-[10px] text-red-400 mt-1">{errors.url}</p>}
                            </div>

                            {/* Video Preview */}
                            {youtubeInfo?.title && (
                                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                                    {youtubeInfo.thumbnail && (
                                        <img src={youtubeInfo.thumbnail} alt="thumb" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{youtubeInfo.title}</p>
                                        <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> URL válida
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Format toggle */}
                            <div>
                                <label className={labelClass}>Tipo de Descarga</label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'audio', label: 'Audio', icon: Music },
                                        { value: 'video', label: 'Video', icon: Video },
                                    ].map(f => (
                                        <button key={f.value} type="button"
                                            onClick={() => { setData(d => ({ ...d, format: f.value, quality: f.value === 'audio' ? '192' : '720p' })); }}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                                                data.format === f.value
                                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/40'
                                            }`}
                                        >
                                            <f.icon className="w-3.5 h-3.5" /> {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality */}
                            <div>
                                <label className={labelClass}>Calidad</label>
                                <select value={data.quality} onChange={e => setData('quality', e.target.value)} className={selectClass}>
                                    {(data.format === 'audio' ? audioQualities : videoQualities).map(q => (
                                        <option key={q.value} value={q.value}>{q.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Station */}
                            <div>
                                <label className={labelClass}>Estación destino</label>
                                <select value={data.station_id} onChange={e => setData('station_id', e.target.value)} className={selectClass}>
                                    <option value="">— Sin asignar (descargar solo) —</option>
                                    {stations.filter(s => data.format === 'video' ? s.type === 'video' : s.type === 'audio').map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={processing || !data.url}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 transform hover:-translate-y-0.5">
                                {processing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Descargando...</>
                                    : <><Download className="w-4 h-4" /> Descargar Ahora</>
                                }
                            </button>
                        </form>
                    </div>
                </div>

                {/* ─── Jobs Queue ─────────────────────────────── */}
                <div className="lg:col-span-3">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
                            <List className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cola de Descargas</h2>
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">{jobs.length} total</span>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="text-center py-16">
                                <Youtube className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-semibold">Sin descargas aún</p>
                                <p className="text-slate-600 text-xs mt-1">Ingresa una URL de YouTube para comenzar</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-900/50">
                                {jobs.map(job => (
                                    <div key={job.id} className="p-4 hover:bg-slate-900/20 transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg mt-0.5 ${job.format === 'video' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                {job.format === 'video' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-200 truncate">{job.title || job.url}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusBadge status={job.status} progress={job.progress} />
                                                    <span className="text-[10px] text-slate-600">{job.quality}</span>
                                                    {job.station_name && (
                                                        <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                                                            <Radio className="w-2.5 h-2.5" /> {job.station_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {job.status === 'downloading' && (
                                                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }} />
                                                    </div>
                                                )}
                                                {job.error && (
                                                    <p className="text-[10px] text-red-400 mt-1 truncate">{job.error}</p>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-600 shrink-0">{job.created_at}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
