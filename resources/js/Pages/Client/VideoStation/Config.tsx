import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Settings, Save, Video, Shield, ShieldCheck, ToggleLeft, Layers, X } from 'lucide-react';
import VideoStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
    max_listeners: number;
    is_active: boolean;
    custom_domain: string | null;
    stream_key: string;
}

interface PageProps {
    station: StationData;
    flash: { success?: string; error?: string };
}

export default function VideoStationConfig() {
    const { station, flash } = usePage<any>().props as PageProps;
    const [configTab, setConfigTab] = useState<'general' | 'limits' | 'features' | 'video' | 'targets'>('general');

    const { data, setData, post, processing, transform } = useForm({
        name: station.name,
        max_listeners: station.max_listeners,
        custom_domain: station.custom_domain || '',
        is_active: station.is_active,
        stream_targets: (station as any).stream_targets || [] as Array<{ platform: string, rtmp_url: string, stream_key: string }>,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ ...d, _method: 'post' }));
        post(`/dashboard/canaltv/${station.id}/config`);
    };

    return (
        <VideoStationLayout currentSection="config">
            <Head title={`${station.name} - Configurar`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                            <Settings className="w-4 h-4" />
                        </div>
                        Configurar
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Modifique las configuraciones y características de su canal de video</p>
                </div>
            </div>

            {/* Sub-tabs for Configure */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl">
                <button
                    onClick={() => setConfigTab('general')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        configTab === 'general' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    General
                </button>
                <button
                    onClick={() => setConfigTab('limits')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        configTab === 'limits' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Limits
                </button>
                <button
                    onClick={() => setConfigTab('features')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        configTab === 'features' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Features
                </button>
                <button
                    onClick={() => setConfigTab('video')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        configTab === 'video' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Video Streaming
                </button>
                <button
                    onClick={() => setConfigTab('targets')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        configTab === 'targets' ? 'bg-pink-500/10 text-pink-400' : 'text-slate-400 hover:text-white'
                    }`}
                    type="button"
                >
                    Stream Targets
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {configTab === 'general' && (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-900 flex items-center gap-2">
                            <Video className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ajustes Generales</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre del Canal</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Slug URL</label>
                                <input
                                    type="text"
                                    value={station.slug}
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-[9px] text-slate-600 mt-1">Identificador único en las URLs públicas. No editable.</p>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Dominio Personalizado</label>
                                <input
                                    type="text"
                                    value={data.custom_domain}
                                    onChange={(e) => setData('custom_domain', e.target.value)}
                                    placeholder="tv.midominio.com"
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-pink-500 focus:ring-pink-500/20"
                                />
                                <label htmlFor="is_active" className="text-xs font-semibold text-slate-300 cursor-pointer">Canal en servicio activo</label>
                            </div>
                        </div>
                    </div>
                )}

                {configTab === 'limits' && (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-900 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Límites del Canal</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Espectadores Simultáneos Máximos</label>
                                <input
                                    type="number"
                                    value={data.max_listeners}
                                    onChange={(e) => setData('max_listeners', parseInt(e.target.value))}
                                    min={10}
                                    max={9999}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ancho de Banda Mensual Permitido</label>
                                <input
                                    type="text"
                                    value="150 GB / Ilimitado"
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Espacio de Almacenamiento Asignado</label>
                                <input
                                    type="text"
                                    value="15000 MB (15 GB)"
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {configTab === 'features' && (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Características Habilitadas</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <FeatureToggle label="Grabación automática de transmisiones (Cloud DVR)" description="Guarda un registro digital de sus streamings de video en el almacenamiento." enabled={false} />
                            <FeatureToggle label="Chat público integrado" description="Muestra una ventana de chat interactiva en la página de visualización pública." enabled={true} />
                            <FeatureToggle label="Restricciones por dominio" description="Permite restringir la inserción HTML5 a dominios web específicos." enabled={false} />
                            <FeatureToggle label="Transcodificación adaptativa en la nube" description="Entrega resoluciones automáticas (1080p, 720p, 480p) basadas en la velocidad del espectador." enabled={true} />
                        </div>
                    </div>
                )}

                {configTab === 'video' && (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-900 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-pink-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ajustes de Video Streaming</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Protocolo de Ingesta</label>
                                <select
                                    defaultValue="rtmp"
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
                                >
                                    <option value="rtmp">RTMP (Real-Time Messaging Protocol)</option>
                                    <option value="srt" disabled>SRT (Secure Reliable Transport) - Próximamente</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Resolución Máxima de Entrada</label>
                                <select
                                    defaultValue="1080p"
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
                                >
                                    <option value="1080p">Full HD (1920x1080) @ 60 FPS</option>
                                    <option value="720p">HD (1280x720) @ 60 FPS</option>
                                    <option value="480p">SD (854x480) @ 30 FPS</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Puerto del Reproductor HTTP</label>
                                <input
                                    type="number"
                                    value={station.port}
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Clave de Flujo (Stream Key)</label>
                                <input
                                    type="text"
                                    value={station.stream_key}
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {configTab === 'targets' && (
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-pink-400" />
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stream Targets (Multi-transmisión)</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = [...(data.stream_targets || [])];
                                    updated.push({ platform: 'Youtube', rtmp_url: '', stream_key: '' });
                                    setData('stream_targets', updated);
                                }}
                                className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 text-pink-400 text-[10px] font-bold rounded-lg transition-all"
                            >
                                + Agregar destino
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-slate-500">Transmita simultáneamente a múltiples plataformas como YouTube, Facebook, Kick o servidores RTMP personalizados en tiempo real.</p>
                            
                            {(data.stream_targets || []).length === 0 ? (
                                <div className="text-center py-8 bg-slate-950/20 border border-dashed border-slate-900 rounded-xl">
                                    <Layers className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                    <p className="text-xs text-slate-550">No hay destinos de transmisión configurados.</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">Haz clic en "+ Agregar destino" para comenzar.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(data.stream_targets || []).map((target: any, index: number) => {
                                        const updateTarget = (field: string, value: string) => {
                                            const updated = [...data.stream_targets];
                                            updated[index] = { ...updated[index], [field]: value };
                                            setData('stream_targets', updated);
                                        };

                                        const removeTarget = () => {
                                            const updated = data.stream_targets.filter((_: any, i: number) => i !== index);
                                            setData('stream_targets', updated);
                                        };

                                        return (
                                            <div key={index} className="p-4 bg-slate-950 border border-slate-900 rounded-xl relative space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={removeTarget}
                                                    className="absolute top-4 right-4 p-1 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                                                    {/* Platform */}
                                                    <div>
                                                        <label className="text-[9px] font-bold text-slate-550 uppercase block mb-1">Plataforma</label>
                                                        <select
                                                            value={target.platform}
                                                            onChange={e => updateTarget('platform', e.target.value)}
                                                            className="w-full bg-slate-900 border border-slate-805 rounded-lg px-3 py-2 text-xs text-white"
                                                        >
                                                            <option value="Youtube">YouTube</option>
                                                            <option value="Facebook">Facebook Live</option>
                                                            <option value="Kick">Kick</option>
                                                            <option value="VK">VK</option>
                                                            <option value="Twitch">Twitch</option>
                                                            <option value="Telegram">Telegram</option>
                                                            <option value="RTMP">RTMP Personalizado</option>
                                                        </select>
                                                    </div>

                                                    {/* Stream Key */}
                                                    <div>
                                                        <label className="text-[9px] font-bold text-slate-550 uppercase block mb-1">Clave de transmisión (Stream Key)</label>
                                                        <input
                                                            type="text"
                                                            value={target.stream_key}
                                                            onChange={e => updateTarget('stream_key', e.target.value)}
                                                            placeholder="live_..."
                                                            className="w-full bg-slate-900 border border-slate-805 rounded-lg px-3 py-2 text-xs text-white font-mono"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                {/* RTMP URL */}
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-555 uppercase block mb-1">URL de RTMP (Opcional, dejar vacío para usar el servidor predeterminado de la plataforma)</label>
                                                    <input
                                                        type="text"
                                                        value={target.rtmp_url || target.url || ''}
                                                        onChange={e => updateTarget('rtmp_url', e.target.value)}
                                                        placeholder={
                                                            target.platform === 'Youtube' ? 'rtmp://a.rtmp.youtube.com/live2' :
                                                            target.platform === 'Facebook' ? 'rtmps://live-api-s.facebook.com:443/rtmp' :
                                                            target.platform === 'Kick' ? 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app' :
                                                            'rtmp://...'
                                                        }
                                                        className="w-full bg-slate-900 border border-slate-805 rounded-lg px-3 py-2 text-xs text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md"
                >
                    <Save className="w-4 h-4" /> Guardar cambios
                </button>
            </form>
        </VideoStationLayout>
    );
}

function FeatureToggle({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
    const [checked, setChecked] = useState(enabled);
    return (
        <div className="flex items-start justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-900/60">
            <div className="space-y-0.5 max-w-lg">
                <span className="text-xs font-bold text-slate-300 block">{label}</span>
                <span className="text-[10px] text-slate-500 block leading-normal">{description}</span>
            </div>
            <button
                type="button"
                onClick={() => setChecked(!checked)}
                className={`p-1 rounded-full transition-all shrink-0 ${
                    checked ? 'text-pink-400' : 'text-slate-600'
                }`}
            >
                <ToggleLeft className={`w-9 h-9 transition-transform duration-300 ${checked ? 'rotate-180 text-pink-500' : ''}`} />
            </button>
        </div>
    );
}
