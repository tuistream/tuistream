import { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Upload, Youtube, Trash2, Play, FolderOpen, Film, Clock, AlertCircle, CheckCircle, X, Download, Search } from 'lucide-react';
import VideoStationLayout from './Layout';

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

interface VideoMedia {
    id: number;
    title: string;
    filename: string;
    duration: number;
    size_bytes: number;
    source: 'upload' | 'youtube';
    created_at: string;
}

export default function VideoStationMedia() {
    const { station } = usePage<any>().props as any;
    const [videos, setVideos] = useState<VideoMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [showYoutube, setShowYoutube] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [ytLoading, setYtLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const api = `/dashboard/canaltv/${station.id}/media`;

    const loadVideos = () => {
        fetch(`${api}/list`, { headers: apiHeaders() })
            .then(r => r.json())
            .then(d => setVideos(d.videos || []))
            .catch(() => setMessage({ type: 'error', text: 'Error al cargar videos' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadVideos(); }, []);

    const uploadVideo = (e: FormEvent) => {
        e.preventDefault();
        const file = fileRef.current?.files?.[0];
        if (!file) { setMessage({ type: 'error', text: 'Selecciona un archivo de video.' }); return; }
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', file.name.replace(/\.[^.]+$/, ''));

        fetch(`${api}/store`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': apiHeaders()['X-CSRF-TOKEN'] },
            body: fd,
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setMessage({ type: 'success', text: `Video "${d.video?.title || file.name}" subido.` });
                    setShowUpload(false);
                    if (fileRef.current) fileRef.current.value = '';
                    loadVideos();
                } else {
                    setMessage({ type: 'error', text: d.message || 'Error al subir' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }))
            .finally(() => setUploading(false));
    };

    const downloadYoutube = () => {
        if (!youtubeUrl.trim()) return;
        setYtLoading(true);
        fetch(`${api}/youtube-dl`, {
            method: 'POST',
            headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: youtubeUrl }),
        })
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setMessage({ type: 'success', text: d.message || 'Descarga iniciada en segundo plano.' });
                    setShowYoutube(false);
                    setYoutubeUrl('');
                    setTimeout(loadVideos, 3000);
                } else {
                    setMessage({ type: 'error', text: d.message || 'Error al descargar' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }))
            .finally(() => setYtLoading(false));
    };

    const deleteVideo = (v: VideoMedia) => {
        if (!confirm(`¿Eliminar "${v.title}"?`)) return;
        fetch(`${api}/${v.id}`, { method: 'DELETE', headers: apiHeaders() })
            .then(r => r.json())
            .then(d => {
                if (d.success) { loadVideos(); setMessage({ type: 'success', text: 'Video eliminado.' }); }
                else setMessage({ type: 'error', text: d.message || 'Error' });
            })
            .catch(() => setMessage({ type: 'error', text: 'Error de red' }));
    };

    const formatDuration = (s: number) => {
        if (!s || s <= 0) return '--:--';
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '—';
        const mb = bytes / (1024 * 1024);
        return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
    };

    return (
        <VideoStationLayout currentSection="media">
            <Head title={`${station.name} - Medios`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl"><Film className="w-4 h-4" /></div>
                        Medios
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Videos locales y descargas de YouTube para tu canal TV</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowYoutube(true)}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <Youtube className="w-3.5 h-3.5" /> YouTube DL
                    </button>
                    <button onClick={() => setShowUpload(true)}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" /> Subir Video
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-xl border text-xs font-medium ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>{message.text}</div>
            )}

            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
                <div className="p-4 border-b border-slate-900 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-pink-400" />
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Archivos ({videos.length})</h3>
                </div>
                <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                    {loading ? <div className="text-center py-12 text-slate-500">Cargando...</div> :
                     videos.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Film className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                            <p className="text-sm">Sin videos</p>
                            <p className="text-[10px] text-slate-600 mt-1">Sube un archivo o descarga desde YouTube para empezar</p>
                        </div>
                    ) : (
                        videos.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-all group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-pink-400">
                                        {v.source === 'youtube' ? <Youtube className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-300 truncate">{v.title}</p>
                                        <p className="text-[9px] text-slate-500 font-mono truncate">{v.filename}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(v.duration)}</span>
                                    <span className="text-[10px] text-slate-600">{formatSize(v.size_bytes)}</span>
                                    <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${v.source === 'youtube' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400'}`}>{v.source === 'youtube' ? 'YT' : 'LOCAL'}</span>
                                    <button onClick={() => deleteVideo(v)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                            <h3 className="text-sm font-bold text-white">Subir Video</h3>
                            <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={uploadVideo} className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Archivo de Video</label>
                                <input type="file" ref={fileRef} accept=".mp4,.mkv,.webm,.mov,.avi,.flv,.ts" required
                                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-pink-500/10 file:text-pink-400 hover:file:bg-pink-500/20 file:cursor-pointer cursor-pointer" />
                                <p className="text-[9px] text-slate-600 mt-1">Formatos: MP4, MKV, WebM, MOV, AVI, FLV, TS — Máx. 2 GB</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancelar</button>
                                <button type="submit" disabled={uploading} className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                    {uploading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Subiendo...</> : <><Upload className="w-3.5 h-3.5" /> Subir</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* YouTube DL Modal */}
            {showYoutube && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-4 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Youtube className="w-4 h-4 text-red-400" /> Descargar desde YouTube</h3>
                            <button onClick={() => setShowYoutube(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">URL del video</label>
                                <div className="relative">
                                    <Youtube className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                    <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowYoutube(false)} className="flex-1 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancelar</button>
                                <button onClick={downloadYoutube} disabled={ytLoading || !youtubeUrl.trim()} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                    {ytLoading ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Descargando...</> : <><Download className="w-3.5 h-3.5" /> Descargar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </VideoStationLayout>
    );
}
