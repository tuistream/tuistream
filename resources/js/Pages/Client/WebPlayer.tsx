import { Head, usePage } from '@inertiajs/react';
import {
    PlaySquare, Copy, CheckCheck, Monitor, Smartphone, Maximize2,
    Palette, Type, Code2, Eye, Radio, Video, HelpCircle, ExternalLink
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
    port: number;
}

interface AppInfo {
    logo: string;
    name: string;
    favicon: string;
}

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/60 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none';

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold"
            title="Copiar Código">
            {copied ? (
                <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                </>
            )}
        </button>
    );
}

export default function WebPlayer() {
    const { station } = usePage<any>().props as { station: Station };

    const isAudio = station.type === 'audio';

    const [appInfo, setAppInfo] = useState<AppInfo>({ logo: '', name: 'TuiStream', favicon: '' });

    useEffect(() => {
        fetch('/admin/settings?section=branding', {
            headers: { 'X-Inertia': 'true', 'Accept': 'application/json' }
        }).then(res => res.json().catch(() => ({})))
          .then(data => {
              if (data?.app_logo || data?.app_name) {
                  setAppInfo({ logo: data.app_logo || '', name: data.app_name || 'TuiStream', favicon: data.app_favicon || '' });
              }
          }).catch(() => {});
    }, []);

    const [config, setConfig] = useState({
        playerType: isAudio ? 'audio' : 'video',
        size: 'normal',
        primaryColor: isAudio ? '#6366f1' : '#ec4899',
        bgColor: '#0f172a',
        textColor: '#f1f5f9',
        title: '',
        showLogo: true,
        showListeners: true,
        autoplay: false,
        preview: 'desktop',
    });

    const set = (key: string, val: any) => setConfig(c => ({ ...c, [key]: val }));

    const sizeMap: Record<string, { w: number | string; h: number }> = {
        compact: { w: 300, h: isAudio ? 80 : 180 },
        normal: { w: 480, h: isAudio ? 120 : 270 },
        full: { w: '100%', h: isAudio ? 180 : 400 }
    };
    const { w, h } = sizeMap[config.size];

    const domain = window.location.host;
    const protocol = window.location.protocol;
    const seoPath = isAudio ? `/radio/${station.slug}` : `/tv/${station.slug}`;
    const publicUrl = `${protocol}//${domain}${seoPath}`;
    const iframeSrc = `${publicUrl}?embed=1&primary=${encodeURIComponent(config.primaryColor)}&bg=${encodeURIComponent(config.bgColor)}&size=${config.size}&autoplay=${config.autoplay}`;

    const iframeCode = `<iframe\n  src="${iframeSrc}"\n  width="${w}"\n  height="${h}"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  scrolling="no"\n  title="${station.name} - ${isAudio ? 'Radio en Vivo' : 'TV en Vivo'}"\n></iframe>`;

    const jsCode = `<!-- ${appInfo.name} Player -->\n<div id="ts-player-${station.slug}"></div>\n<script src="${protocol}//${domain}/player.js"></script>\n<script>\n  TuiStream.init({\n    container: '#ts-player-${station.slug}',\n    station:   '${station.slug}',\n    type:      '${config.playerType}',\n    primary:   '${config.primaryColor}',\n    autoplay:   ${config.autoplay},\n  });\n</script>`;

    const tabClass = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
            active 
                ? isAudio ? 'bg-indigo-500 text-white' : 'bg-pink-500 text-white'
                : 'text-slate-500 hover:text-slate-300'
        }`;

    // Mini player preview components
    const AudioPlayerPreview = () => (
        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-900/60" style={{ background: config.bgColor, color: config.textColor, width: config.preview === 'mobile' ? 320 : 480 }}>
            <div style={{ borderTop: `2px solid ${config.primaryColor}` }} />
            <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.primaryColor + '20', border: `1px solid ${config.primaryColor}40` }}>
                    <Radio className="w-5 h-5" style={{ color: config.primaryColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: config.textColor }}>{config.title || station.name}</p>
                    <p className="text-[10px] opacity-60 truncate" style={{ color: config.textColor }}>En vivo — {station.status === 'online' ? '192 kbps' : 'Fuera de Línea'}</p>
                    {config.showListeners && (
                        <p className="text-[10px] mt-0.5" style={{ color: config.primaryColor }}>🎧 {station.status === 'online' ? '124 oyentes' : '0 oyentes'}</p>
                    )}
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" style={{ background: config.primaryColor }}>
                    <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
                <div className="h-1 rounded-full opacity-35 flex-1" style={{ background: config.primaryColor }} />
                {config.showLogo && (appInfo.logo ? (
                    <img src={appInfo.logo} alt={appInfo.name} className="w-12 h-4 ml-2 rounded opacity-70 object-contain" />
                ) : (
                    <span className="text-[8px] text-white/50 font-bold ml-2">{appInfo.name}</span>
                ))}
            </div>
        </div>
    );

    const VideoPlayerPreview = () => (
        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-900/60" style={{ background: '#000', width: config.preview === 'mobile' ? 320 : 480, aspectRatio: '16/9', position: 'relative' }}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: config.primaryColor + 'aa' }}>
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center px-3 gap-2" style={{ background: 'linear-gradient(transparent,' + config.bgColor + ')' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                <span className="text-[10px] text-white font-bold">EN VIVO</span>
                <div className="flex-1 h-1 rounded-full mx-2" style={{ background: config.primaryColor + '60' }}>
                    <div className="h-full rounded-full w-1/3" style={{ background: config.primaryColor }} />
                </div>
                {config.showLogo && (appInfo.logo ? (
                    <img src={appInfo.logo} alt={appInfo.name} className="w-12 h-4 rounded opacity-80 object-contain" />
                ) : (
                    <span className="text-[8px] text-white/70 font-bold">{appInfo.name}</span>
                ))}
                <Maximize2 className="w-3.5 h-3.5 text-white opacity-60" />
            </div>
        </div>
    );

    const LayoutComponent = isAudio ? StationLayout : VideoStationLayout;

    return (
        <LayoutComponent currentSection="web-player">
            <Head title={`Web Player — ${station.name}`} />

            <div className="flex items-center gap-3 mb-8">
                <div className={`p-2.5 rounded-xl border ${
                    isAudio 
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                }`}>
                    <PlaySquare className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Generador de Web Player</h1>
                    <p className="text-sm text-slate-500 mt-1">Personaliza y genera códigos embed para integrar tu streaming de audio/video en tu sitio web</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* ─── Config Panel ─── */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-${isAudio ? 'indigo' : 'pink'}-500/30 to-transparent`} />

                        {/* Player Type */}
                        {station.type === 'video' && (
                            <div>
                                <label className={labelClass}>Tipo de Player</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { v: 'video', l: 'Video Player', icon: Video },
                                        { v: 'audio', l: 'Audio Only Player', icon: Radio },
                                    ].map(({ v, l, icon: Icon }) => (
                                        <button key={v} onClick={() => set('playerType', v)}
                                            className={`py-2 rounded-xl text-[10px] font-bold border flex items-center justify-center gap-1.5 transition-all ${
                                                config.playerType === v
                                                    ? 'bg-pink-600 border-pink-600 text-white'
                                                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                                            }`}>
                                            <Icon className="w-3 h-3" />{l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        <div>
                            <label className={labelClass}>Tamaño del iframe</label>
                            <div className="flex gap-2">
                                {['compact', 'normal', 'full'].map(s => (
                                    <button key={s} onClick={() => set('size', s)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border capitalize transition-all ${
                                            config.size === s 
                                                ? isAudio ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-pink-600 border-pink-600 text-white'
                                                : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                                        }`}>
                                        {s === 'compact' ? 'Compacto' : s === 'normal' ? 'Mediano' : 'Completo (100%)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'primaryColor', label: 'Color Principal' },
                                { key: 'bgColor',      label: 'Color de Fondo' },
                                { key: 'textColor',    label: 'Color de Texto' },
                            ].map(({ key, label }) => (
                                <div key={key}>
                                    <label className={labelClass}>{label}</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={(config as any)[key]} onChange={e => set(key, e.target.value)}
                                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0" />
                                        <span className="text-[9px] font-mono text-slate-550">{(config as any)[key]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Title */}
                        <div>
                            <label className={labelClass}>Título del reproductor</label>
                            <input type="text" value={config.title} onChange={e => set('title', e.target.value)}
                                placeholder={station.name} className={inputClass} />
                        </div>

                        {/* Toggles */}
                        <div className="space-y-2 pt-2 border-t border-slate-900/60">
                            {[
                                { key: 'showListeners', label: 'Mostrar oyentes en vivo' },
                                { key: 'autoplay',      label: 'Autoplay (Iniciar automáticamente)' },
                                { key: 'showLogo',      label: 'Mostrar Logo del Sistema' },
                            ].map(({ key, label }) => (
                                <label key={key} className="flex items-center justify-between gap-3 cursor-pointer py-0.5">
                                    <span className="text-xs text-slate-450">{label}</span>
                                    <button onClick={() => set(key, !(config as any)[key])}
                                        className={`w-10 h-5 rounded-full transition-all relative ${
                                            (config as any)[key] 
                                                ? isAudio ? 'bg-indigo-650' : 'bg-pink-650'
                                                : 'bg-slate-900'
                                        }`}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(config as any)[key] ? 'left-5.5' : 'left-0.5'}`} />
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
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <Eye className={`w-4 h-4 ${isAudio ? 'text-indigo-400' : 'text-pink-400'}`} />
                                Vista Previa del Player
                            </span>
                            <div className="flex gap-1">
                                {[{ v: 'desktop', icon: Monitor }, { v: 'mobile', icon: Smartphone }].map(({ v, icon: Icon }) => (
                                    <button key={v} onClick={() => set('preview', v)} className={tabClass(config.preview === v)}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center py-6 bg-slate-950/20 rounded-xl border border-slate-900/40">
                            {config.playerType === 'video' ? <VideoPlayerPreview /> : <AudioPlayerPreview />}
                        </div>
                    </div>

                    {/* Embed codes */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden">
                        <div className="flex border-b border-slate-900">
                            <div className="flex-1 px-5 py-3 flex items-center gap-2 bg-slate-900/10">
                                <Code2 className={`w-4 h-4 ${isAudio ? 'text-indigo-400' : 'text-pink-400'}`} />
                                <span className="text-xs font-bold text-slate-350">Código de Integración</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Option 1: Iframe */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opción 1: Iframe Standard (Recomendado)</span>
                                    <CopyButton text={iframeCode} />
                                </div>
                                <pre className="w-full bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
                                    {iframeCode}
                                </pre>
                            </div>

                            {/* Option 2: Javascript */}
                            <div className="space-y-2 pt-2 border-t border-slate-900/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opción 2: Widget Widget/JS (Carga Dinámica)</span>
                                    <CopyButton text={jsCode} />
                                </div>
                                <pre className="w-full bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
                                    {jsCode}
                                </pre>
                            </div>

                            {/* Option 3: Direct Link */}
                            <div className="space-y-2 pt-2 border-t border-slate-900/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace Directo / URL Pública (SEO)</span>
                                    <a href={publicUrl} target="_blank" rel="noreferrer"
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                            isAudio 
                                                ? 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10' 
                                                : 'border-pink-500/20 text-pink-400 bg-pink-500/5 hover:bg-pink-500/10'
                                        }`}>
                                        <ExternalLink className="w-3 h-3" />
                                        Abrir en pestaña nueva
                                    </a>
                                </div>
                                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-350 select-all truncate">
                                    {publicUrl}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutComponent>
    );
}
