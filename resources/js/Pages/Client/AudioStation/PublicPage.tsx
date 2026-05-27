import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Globe, Eye, Palette, LayoutGrid, CheckCircle, ExternalLink } from 'lucide-react';
import AudioStationLayout from './Layout';

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
}

export default function AudioStationPublicPage() {
    const { station, url } = usePage<any>().props as PageProps;
    const [themeColor, setThemeColor] = useState('#6366f1');
    const [pageTitle, setPageTitle] = useState(station.name);
    const [saved, setSaved] = useState(false);
    const [appInfo, setAppInfo] = useState<AppInfo>({ logo: '', name: 'TuiStream' });

    const domain = window.location.host;
    const protocol = window.location.protocol;
    const seoUrl = `${protocol}//${domain}/radio/${station.slug}`;

    useEffect(() => {
        fetch('/admin/settings?section=branding', {
            headers: { 'X-Inertia': 'true', 'Accept': 'application/json' }
        }).then(res => res.json().catch(() => ({})))
          .then(data => {
              if (data?.app_logo || data?.app_name) {
                  setAppInfo({ logo: data.app_logo || '', name: data.app_name || 'TuiStream' });
              }
          }).catch(() => {});
    }, []);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <AudioStationLayout currentSection="public">
            <Head title={`${station.name} - Página Pública`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Globe className="w-4 h-4" />
                        </div>
                        Página Pública
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Configure la estética y el diseño de la página de escucha web pública de su radio</p>
                </div>
                <a
                    href={seoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver Página Pública
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Visual Customizations */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diseño y Colores</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Título de la Emisora Pública</label>
                                <input
                                    type="text"
                                    value={pageTitle}
                                    onChange={(e) => setPageTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Color del Acento Visual</label>
                                <div className="flex gap-2">
                                    {['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setThemeColor(color)}
                                            style={{ backgroundColor: color }}
                                            className={`w-7 h-7 rounded-full transition-all ${
                                                themeColor === color
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                                                    : 'opacity-70 hover:opacity-100'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Panel */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Características Adicionales</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Mostrar carátula de álbum y artista del tema actual</span>
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Habilitar chat en vivo integrado</span>
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-300">Permitir peticiones de canciones automáticas</span>
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                        {saved ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : null}
                        {saved ? 'Guardado con éxito' : 'Guardar Configuración'}
                    </button>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden sticky top-6">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vista Previa</h3>
                        </div>
                        <div className="p-5 bg-slate-950">
                            <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-4 shadow-xl space-y-4">
                                <div className="flex items-center gap-2">
                                    {appInfo.logo ? (
                                        <img src={appInfo.logo} alt={appInfo.name} className="w-5 h-5 rounded object-contain" />
                                    ) : (
                                        <div className="w-5 h-5 rounded flex items-center justify-center text-[7px] font-black" style={{ backgroundColor: themeColor, color: '#fff' }}>
                                            {appInfo.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="text-[9px] font-bold text-slate-400">{appInfo.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold text-white">{pageTitle}</h4>
                                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                                </div>
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <Palette className="w-6 h-6 text-indigo-400" style={{ color: themeColor }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-extrabold text-slate-200">Canción Actual</p>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">Antony Santos - Voy Pa'llá</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AudioStationLayout>
    );
}
