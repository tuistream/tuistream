import { Head, usePage } from '@inertiajs/react';
import {
    PlaySquare, Copy, CheckCheck, Monitor, Smartphone, Maximize2,
    Palette, Type, Code2, Eye, Radio, Video as VideoIcon, RefreshCw
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import AdminLayout from './Layout';

// Video.js v10 React wrapper
import { VideoPlayer, AudioPlayer } from '@videojs/react';
// @ts-ignore
import '@videojs/http-streaming';

interface Station { id: number; name: string; type: 'audio' | 'video'; slug: string; port: number; status: string; }

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-white transition-all"
            title="Copiar">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
    );
}

export default function PlayerGenerator() {
    const { stations } = usePage<any>().props as { stations: Station[] };

    const [config, setConfig] = useState({
        stationId:    stations[0]?.id?.toString() ?? '',
        playerType:   stations[0]?.type === 'video' ? 'video' : 'audio',
        size:         'normal',
        primaryColor: '#6366f1',
        bgColor:      '#0f172a',
        title:        '',
        showLogo:     true,
        showListeners: true,
        autoplay:     false,
        preview:      'desktop',
    });

    const set = (key: string, val: any) => setConfig(c => ({ ...c, [key]: val }));

    const station = stations.find(s => s.id.toString() === config.stationId);

    // Reset player type when station changes
    const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newId = e.target.value;
        const s = stations.find(s2 => s2.id.toString() === newId);
        set('stationId', newId);
        if (s) set('playerType', s.type === 'video' ? 'video' : 'audio');
    };

    const domain = window.location.hostname;

    const seoPath = config.playerType === 'video'
        ? `/tv/${station?.slug ?? 'live'}`
        : `/radio/${station?.slug ?? 'live'}`;

    const publicUrl = `https://${domain}${seoPath}`;

    const iframeSrc = `${publicUrl}?embed=1&primary=${encodeURIComponent(config.primaryColor)}&bg=${encodeURIComponent(config.bgColor)}&autoplay=${config.autoplay}`;

    const sizeMap = { compact: { w: 320, h: config.playerType === 'video' ? 200 : 100 }, normal: { w: 560, h: config.playerType === 'video' ? 340 : 140 }, full: { w: '100%', h: config.playerType === 'video' ? 480 : 200 } };
    const { w, h } = sizeMap[config.size as keyof typeof sizeMap];

    const iframeCode = `<iframe\n  src="${iframeSrc}"\n  width="${w}"\n  height="${h}"\n  frameborder="0"\n  allow="autoplay; fullscreen; encrypted-media"\n  scrolling="no"\n  title="${config.title || station?.name || 'TuiStream Player'}"\n></iframe>`;

    const jsCode = `<!-- TuiStream Video.js v10 Player -->\n<div id="ts-player-${station?.slug ?? 'live'}"></div>\n<script src="https://${domain}/player.js"></script>\n<link href="https://vjs.zencdn.net/8.23.7/video-js.css" rel="stylesheet" />\n<script>\n  const player = videojs('ts-player-${station?.slug ?? 'live'}', {\n    controls: true,\n    autoplay: ${config.autoplay},\n    preload: 'auto',\n    fluid: true,\n    aspectRatio: '${config.playerType === 'video' ? '16:9' : 'auto'}',\n  });\n</script>`;

    const tabClass = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${active ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`;

    // ── Video.js v10 Preview Component ──
    const VideoPreview = () => {
        if (!station) return <PreviewFallback type="video" />;
        const isVideo = config.playerType === 'video';
        const playerWidth = config.preview === 'mobile' ? 320 : 560;

        if (isVideo) {
            return (
                <div className="rounded-xl overflow-hidden shadow-2xl" style={{ maxWidth: playerWidth }}>
                    <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: config.primaryColor + '40' }}>
                        <VideoPlayer
                            key={`video-${station.id}`}
                            controls
                            autoplay={config.autoplay}
                            preload="auto"
                            fluid
                            aspectRatio="16:9"
                            className="video-js vjs-big-play-centered"
                            style={{ '--vjs-primary': config.primaryColor } as React.CSSProperties}
                            poster={`https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop`}
                        >
                            <track kind="captions" />
                        </VideoPlayer>
                    </div>
                    <div className="flex items-center justify-between p-3" style={{ background: config.bgColor }}>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                            <div>
                                <p className="text-[11px] font-bold text-white">{config.title || station.name}</p>
                                <p className="text-[8px] text-slate-400">EN VIVO — 1080p</p>
                            </div>
                        </div>
                        {config.showLogo && (
                            <span className="text-[9px] font-bold opacity-50 text-white">Powered by Video.js v10</span>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="rounded-xl overflow-hidden shadow-2xl" style={{ maxWidth: playerWidth, background: config.bgColor }}>
                <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: config.primaryColor + '40' }}>
                    <AudioPlayer
                        key={`audio-${station.id}`}
                        controls
                        autoplay={config.autoplay}
                        preload="auto"
                        fluid
                        className="video-js vjs-big-play-centered"
                        style={{ '--vjs-primary': config.primaryColor, minHeight: config.size === 'compact' ? 60 : 80 } as React.CSSProperties}
                    >
                        <track kind="captions" />
                    </AudioPlayer>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                    <div>
                        <p className="text-[11px] font-bold" style={{ color: '#fff' }}>{config.title || station.name}</p>
                        <p className="text-[8px] opacity-60" style={{ color: '#fff' }}>{station.bitrate || 128} kbps • MP3</p>
                    </div>
                    {config.showListeners && (
                        <span className="text-[10px] font-bold" style={{ color: config.primaryColor }}>
                            🎧 {station.max_listeners || 0} oyentes
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AdminLayout currentPage="player-generator">
            <Head title="Web Player Generator — TuiStream Admin" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <PlaySquare className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Web Player Generator</h1>
                    <p className="text-sm text-slate-500">Genera reproductores Video.js v10 embebibles para tus estaciones de radio y TV</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4">
                        <div>
                            <label className={labelClass}>Estación</label>
                            <select value={config.stationId} onChange={handleStationChange} className={selectClass}>
                                {stations.filter(s => s.type === 'audio' || s.type === 'video').map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.type === 'video' ? 'TV' : 'Radio'})</option>
                                ))}
                            </select>
                        </div>

                        {station && (
                            <>
                                <div>
                                    <label className={labelClass}>Tipo de Player</label>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {station.type !== 'video' && (
                                            <button onClick={() => set('playerType', 'audio')}
                                                className={`py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                                                    config.playerType === 'audio' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                                                }`}>
                                                <Radio className="w-3 h-3" />Audio
                                            </button>
                                        )}
                                        {station.type !== 'audio' && (
                                            <button onClick={() => set('playerType', 'video')}
                                                className={`py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                                                    config.playerType === 'video' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                                                }`}>
                                                <VideoIcon className="w-3 h-3" />Video
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Tamaño</label>
                                    <div className="flex gap-2">
                                        {['compact', 'normal', 'full'].map(s => (
                                            <button key={s} onClick={() => set('size', s)}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-bold border capitalize transition-all ${
                                                    config.size === s ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                                                }`}>{s}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'primaryColor', label: 'Color Principal' },
                                        { key: 'bgColor', label: 'Fondo' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className={labelClass}>{label}</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={(config as any)[key]} onChange={e => set(key, e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0" />
                                                <span className="text-[10px] font-mono text-slate-500">{(config as any)[key]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className={labelClass}>Título personalizado</label>
                                    <input type="text" value={config.title} onChange={e => set('title', e.target.value)}
                                        placeholder={station.name} className={inputClass} />
                                </div>

                                <div className="space-y-2">
                                    {[
                                        { key: 'showListeners', label: 'Mostrar oyentes en vivo' },
                                        { key: 'autoplay', label: 'Autoplay al cargar' },
                                        { key: 'showLogo', label: 'Mostrar branding' },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center justify-between gap-3 cursor-pointer">
                                            <span className="text-xs text-slate-400">{label}</span>
                                            <button onClick={() => set(key, !(config as any)[key])}
                                                className={`w-10 h-5 rounded-full transition-all relative ${(config as any)[key] ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(config as any)[key] ? 'left-5' : 'left-0.5'}`} />
                                            </button>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="xl:col-span-3 space-y-4">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-indigo-400" />Vista Previa — Video.js v10
                            </span>
                            <div className="flex gap-1">
                                {[{ v: 'desktop', icon: Monitor }, { v: 'mobile', icon: Smartphone }].map(({ v, icon: Icon }) => (
                                    <button key={v} onClick={() => set('preview', v)} className={tabClass(config.preview === v)}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center py-6">
                            {station ? <VideoPreview /> : (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    <PlaySquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    Selecciona una estación para ver la vista previa
                                </div>
                            )}
                        </div>
                    </div>

                    {station && (
                        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden">
                            <div className="flex border-b border-slate-900 px-5 py-3 items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-bold text-slate-300">Código de Integración</span>
                                <span className="text-[9px] text-slate-500 ml-auto">
                                    SEO URL: <span className="text-indigo-400 font-mono">{publicUrl}</span>
                                </span>
                            </div>

                            <div className="p-5 border-b border-slate-900">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">iframe Embed</span>
                                    <CopyButton text={iframeCode} />
                                </div>
                                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap border border-slate-800">{iframeCode}</pre>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">JavaScript SDK (Video.js v10)</span>
                                    <CopyButton text={jsCode} />
                                </div>
                                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap border border-slate-800">{jsCode}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function PreviewFallback({ type }: { type: 'video' | 'audio' }) {
    return (
        <div className="text-center py-10 text-slate-500 bg-slate-950 rounded-xl border border-slate-800 px-6">
            <PlaySquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-xs font-bold">Selecciona una estación de {type === 'video' ? 'TV' : 'Radio'} para previsualizar</p>
            <p className="text-[10px] text-slate-600 mt-1">El reproductor Video.js v10 se cargará aquí</p>
        </div>
    );
}
