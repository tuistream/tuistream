import { Head, usePage } from '@inertiajs/react';
import {
    PlaySquare, Copy, CheckCheck, Monitor, Smartphone, Maximize2,
    Palette, Type, Image, Code2, Eye, Radio, Video, RefreshCw, Download
} from 'lucide-react';
import { useState, useCallback } from 'react';
import AdminLayout from './Layout';

interface Station { id: number; name: string; type: 'audio' | 'video'; slug: string; port: number; }

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
        playerType:   'audio',      // audio | video | radio-widget
        size:         'normal',     // compact | normal | full
        primaryColor: '#6366f1',
        bgColor:      '#0f172a',
        textColor:    '#f1f5f9',
        title:        '',
        showLogo:     true,
        showListeners: true,
        autoplay:     false,
        preview:      'desktop',    // desktop | mobile
    });

    const set = (key: string, val: any) => setConfig(c => ({ ...c, [key]: val }));

    const station = stations.find(s => s.id.toString() === config.stationId);

    const streamUrl = station
        ? config.playerType === 'video'
            ? `http://\${SERVER_IP}:${station.port}/hls/live/${station.slug}.m3u8`
            : `http://\${SERVER_IP}:${station.port}/${station.slug}`
        : '';

    const sizeMap = { compact: { w: 300, h: 80 }, normal: { w: 480, h: 120 }, full: { w: '100%', h: 200 } };
    const { w, h } = sizeMap[config.size as keyof typeof sizeMap];

    const iframeSrc = `/player/${station?.slug ?? ''}?type=${config.playerType}&primary=${encodeURIComponent(config.primaryColor)}&bg=${encodeURIComponent(config.bgColor)}&size=${config.size}&autoplay=${config.autoplay}&listeners=${config.showListeners}`;

    const iframeCode = `<iframe\n  src="https://TUISTREAM_DOMAIN${iframeSrc}"\n  width="${w}"\n  height="${h}"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  scrolling="no"\n></iframe>`;

    const jsCode = `<!-- TuiStream Player -->\n<div id="ts-player-${station?.slug}"></div>\n<script src="https://TUISTREAM_DOMAIN/player.js"></script>\n<script>\n  TuiStream.init({\n    container: '#ts-player-${station?.slug}',\n    station:   '${station?.slug}',\n    type:      '${config.playerType}',\n    primary:   '${config.primaryColor}',\n    autoplay:   ${config.autoplay},\n  });\n</script>`;

    const tabClass = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${active ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-300'}`;

    // Mini player preview component
    const AudioPlayerPreview = () => (
        <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: config.bgColor, color: config.textColor, width: config.preview === 'mobile' ? 320 : 480 }}>
            <div style={{ borderTop: `2px solid ${config.primaryColor}` }} />
            <div className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: config.primaryColor + '20', border: `1px solid ${config.primaryColor}40` }}>
                    <Radio className="w-5 h-5" style={{ color: config.primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: config.textColor }}>{config.title || station?.name || 'Mi Radio'}</p>
                    <p className="text-[10px] opacity-60 truncate" style={{ color: config.textColor }}>En vivo — 128 kbps</p>
                    {config.showListeners && (
                        <p className="text-[10px] mt-0.5" style={{ color: config.primaryColor }}>🎧 247 oyentes</p>
                    )}
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: config.primaryColor }}>
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </div>
            <div className="px-4 pb-3">
                <div className="h-1 rounded-full opacity-30" style={{ background: config.primaryColor }} />
            </div>
        </div>
    );

    const VideoPlayerPreview = () => (
        <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: '#000', width: config.preview === 'mobile' ? 320 : 480, aspectRatio: '16/9', position: 'relative' }}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: config.primaryColor + 'aa' }}>
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center px-3 gap-2" style={{ background: 'linear-gradient(transparent,' + config.bgColor + ')' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                <span className="text-[10px] text-white font-bold">EN VIVO</span>
                <div className="flex-1 h-1 rounded-full mx-2" style={{ background: config.primaryColor + '60' }}>
                    <div className="h-full rounded-full w-1/2" style={{ background: config.primaryColor }} />
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-white opacity-60" />
            </div>
        </div>
    );

    return (
        <AdminLayout currentPage="player-generator">
            <Head title="Web Player Generator — TuiStream Admin" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <PlaySquare className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Web Player Generator</h1>
                    <p className="text-sm text-slate-500">Genera reproductores embebibles personalizados para tus estaciones</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* ─── Config Panel ─── */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4">

                        {/* Station */}
                        <div>
                            <label className={labelClass}>Estación</label>
                            <select value={config.stationId} onChange={e => { set('stationId', e.target.value); set('playerType', stations.find(s => s.id.toString() === e.target.value)?.type || 'audio'); }} className={selectClass}>
                                {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                            </select>
                        </div>

                        {/* Player Type */}
                        <div>
                            <label className={labelClass}>Tipo de Player</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[
                                    { v: 'audio', l: 'Audio', icon: Radio },
                                    { v: 'video', l: 'Video', icon: Video },
                                    { v: 'radio-widget', l: 'Widget', icon: Monitor },
                                ].map(({ v, l, icon: Icon }) => (
                                    <button key={v} onClick={() => set('playerType', v)}
                                        className={`py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1 transition-all ${
                                            config.playerType === v
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/40'
                                        }`}>
                                        <Icon className="w-3 h-3" />{l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div>
                            <label className={labelClass}>Tamaño</label>
                            <div className="flex gap-2">
                                {['compact', 'normal', 'full'].map(s => (
                                    <button key={s} onClick={() => set('size', s)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border capitalize transition-all ${
                                            config.size === s ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                                        }`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'primaryColor', label: 'Color Principal' },
                                { key: 'bgColor',      label: 'Fondo' },
                                { key: 'textColor',    label: 'Texto' },
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

                        {/* Title */}
                        <div>
                            <label className={labelClass}>Título personalizado</label>
                            <input type="text" value={config.title} onChange={e => set('title', e.target.value)}
                                placeholder={station?.name ?? 'Mi Radio'} className={inputClass} />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2">
                            {[
                                { key: 'showListeners', label: 'Mostrar oyentes en vivo' },
                                { key: 'autoplay',      label: 'Autoplay al cargar' },
                                { key: 'showLogo',      label: 'Mostrar logo' },
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
                    </div>
                </div>

                {/* ─── Preview + Code ─── */}
                <div className="xl:col-span-3 space-y-4">

                    {/* Preview */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-400" />Vista Previa</span>
                            <div className="flex gap-1">
                                {[{ v: 'desktop', icon: Monitor }, { v: 'mobile', icon: Smartphone }].map(({ v, icon: Icon }) => (
                                    <button key={v} onClick={() => set('preview', v)} className={tabClass(config.preview === v)}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center py-6">
                            {config.playerType === 'video' ? <VideoPlayerPreview /> : <AudioPlayerPreview />}
                        </div>
                    </div>

                    {/* Embed codes */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden">
                        <div className="flex border-b border-slate-900">
                            <div className="flex-1 px-5 py-3 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-bold text-slate-300">Código de Integración</span>
                            </div>
                        </div>

                        {[
                            { title: 'iframe Embed', code: iframeCode, lang: 'html' },
                            { title: 'JavaScript SDK', code: jsCode, lang: 'html' },
                        ].map(({ title, code }) => (
                            <div key={title} className="p-5 border-b border-slate-900">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                                    <CopyButton text={code} />
                                </div>
                                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap border border-slate-800">{code}</pre>
                            </div>
                        ))}

                        {/* Stream URL */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">URL de Stream Directo</span>
                                <CopyButton text={streamUrl} />
                            </div>
                            <code className="text-[10px] font-mono text-indigo-400 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800 block">{streamUrl}</code>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
