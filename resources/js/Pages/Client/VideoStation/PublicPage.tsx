import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Globe, Eye, Palette, LayoutGrid, CheckCircle, Code2, Copy,
    CheckCheck, Share2, Smartphone, ExternalLink, Image, Type
} from 'lucide-react';
import VideoStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    slug: string;
}

interface PageProps {
    station: StationData;
    url: string;
}

interface AppInfo {
    logo: string;
    name: string;
    favicon: string;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
        </button>
    );
}

export default function VideoStationPublicPage() {
    const { station, url } = usePage<any>().props as PageProps;
    const [themeColor, setThemeColor] = useState('#ec4899');
    const [pageTitle, setPageTitle] = useState(station.name);
    const [pageDescription, setPageDescription] = useState(`Mira ${station.name} en vivo. Streaming de TV online las 24 horas.`);
    const [showViewers, setShowViewers] = useState(true);
    const [showShare, setShowShare] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [saved, setSaved] = useState(false);
    const [appInfo, setAppInfo] = useState<AppInfo>({ logo: '', name: 'TuiStream', favicon: '' });

    const domain = window.location.host;
    const protocol = window.location.protocol;
    const seoUrl = `${protocol}//${domain}/tv/${station.slug}`;

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

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const embedCode = `<iframe\n  src="${seoUrl}?embed=1"\n  width="640"\n  height="360"\n  frameborder="0"\n  allow="autoplay; fullscreen"\n  scrolling="no"\n  title="${pageTitle}"\n></iframe>`;

    return (
        <VideoStationLayout currentSection="public">
            <Head title={`${station.name} - Página Pública`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                            <Globe className="w-4 h-4" />
                        </div>
                        Página Pública del Canal
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Personalice la experiencia de su canal de TV para los visitantes</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={seoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Ver Página Pública
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Configuration */}
                <div className="lg:col-span-7 space-y-6">

                    {/* SEO & Branding */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <Type className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">SEO & Marca</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Título de la Página (SEO Title)</label>
                                <input
                                    type="text"
                                    value={pageTitle}
                                    onChange={(e) => setPageTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descripción (Meta Description)</label>
                                <textarea
                                    value={pageDescription}
                                    onChange={(e) => setPageDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50 resize-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">URL Pública SEO</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-400 truncate select-all">
                                        {seoUrl}
                                    </div>
                                    <CopyButton text={seoUrl} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Design */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diseño y Colores</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Color de Acento</label>
                                <div className="flex gap-2">
                                    {['#ec4899', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setThemeColor(color)}
                                            style={{ backgroundColor: color }}
                                            className={`w-8 h-8 rounded-full transition-all ${
                                                themeColor === color
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                                                    : 'opacity-70 hover:opacity-100'
                                            }`}
                                        />
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={themeColor}
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Imagen de Portada (opcional)</label>
                                <div className="w-full h-20 bg-slate-950 border border-dashed border-slate-800 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:border-pink-500/30 transition-all">
                                    <Image className="w-4 h-4 text-slate-600" />
                                    <span className="text-xs text-slate-600">Clic para subir portada del canal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features & Modules */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Módulos del Reproductor</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Mostrar contador de espectadores</span>
                                <button onClick={() => setShowViewers(!showViewers)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${showViewers ? 'bg-pink-600' : 'bg-slate-900'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showViewers ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Botones de compartir en redes sociales</span>
                                <button onClick={() => setShowShare(!showShare)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${showShare ? 'bg-pink-600' : 'bg-slate-900'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showShare ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Habilitar chat en vivo junto al reproductor</span>
                                <button onClick={() => setShowChat(!showChat)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${showChat ? 'bg-pink-600' : 'bg-slate-900'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showChat ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Embed Code */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Código Embed</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-[10px] text-slate-500">Inserte este código en cualquier sitio web para mostrar su canal de TV en vivo:</p>
                            <div className="relative">
                                <pre className="w-full bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
                                    {embedCode}
                                </pre>
                            </div>
                            <CopyButton text={embedCode} />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                        {saved ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : null}
                        {saved ? 'Guardado con éxito' : 'Guardar Configuración'}
                    </button>
                </div>

                {/* Right Column - Preview */}
                <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista Previa</h3>
                            <div className="flex gap-1">
                                <button className="px-2 py-1 rounded text-[9px] bg-slate-900 text-slate-400 font-bold">Desktop</button>
                                <button className="px-2 py-1 rounded text-[9px] bg-slate-950 text-slate-600">Móvil</button>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Browser chrome */}
                            <div className="rounded-xl border border-slate-900 bg-slate-950 shadow-xl overflow-hidden">
                                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-900/50 bg-slate-900/10">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                                    <span className="text-[8px] text-slate-600 font-mono ml-2 truncate">{seoUrl}</span>
                                </div>

                                {/* Page header */}
                                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-900/30">
                                    {appInfo.logo ? (
                                        <img src={appInfo.logo} alt={appInfo.name} className="w-6 h-6 rounded object-contain" />
                                    ) : (
                                        <div className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-black" style={{ backgroundColor: themeColor, color: '#fff' }}>
                                            {appInfo.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold text-white">{appInfo.name}</span>
                                </div>

                                {/* Content area */}
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-extrabold text-white">{pageTitle}</h4>
                                        <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">En Vivo</span>
                                    </div>
                                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-slate-800 relative group">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div style={{ borderColor: themeColor }} className="w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" style={{ color: themeColor }}>
                                                    <path d="M8 5v14l11-7z"/>
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                                            <span className="text-[8px] text-white font-bold">EN VIVO</span>
                                            {showViewers && (
                                                <span className="text-[8px] text-white/60 ml-auto">👁 245</span>
                                            )}
                                        </div>
                                    </div>

                                    {showShare && (
                                        <div className="flex gap-1.5 justify-center pt-1">
                                            {[
                                                { label: 'FB', color: '#1877f2' },
                                                { label: 'X', color: '#000' },
                                                { label: 'WA', color: '#25d366' },
                                                { label: 'TG', color: '#0088cc' },
                                            ].map(s => (
                                                <span key={s.label}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white opacity-50"
                                                    style={{ background: s.color }}>
                                                    {s.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[9px] text-slate-600 leading-relaxed">{pageDescription}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VideoStationLayout>
    );
}
