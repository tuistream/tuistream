import { Head, useForm, usePage } from '@inertiajs/react';
import { Settings, Save, Disc, Video } from 'lucide-react';
import StationLayout from './StationLayout';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
    bitrate: number;
    max_listeners: number;
    frontend: string;
    stream_key: string;
    custom_domain: string | null;
    is_active: boolean;
}

interface PageProps {
    station: StationData;
    flash: { success?: string; error?: string };
}

export default function StationConfig() {
    const { station, flash } = usePage<any>().props as PageProps;
    const isAudio = station.type === 'audio';

    const { data, setData, post, processing, transform } = useForm({
        name: station.name,
        bitrate: station.bitrate,
        max_listeners: station.max_listeners,
        custom_domain: station.custom_domain || '',
        is_active: station.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((d) => ({ ...d, _method: 'post' }));
        post(`/dashboard/station/${station.id}/config`);
    };

    return (
        <StationLayout currentSection="config">
            <Head title={`${station.name} - Configurar`} />

            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                            <Settings className="w-5 h-5" />
                        </div>
                        Configurar
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Ajustes de la estación {station.name}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                {/* General */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-900">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            {isAudio ? <Disc className="w-4 h-4 text-indigo-400" /> : <Video className="w-4 h-4 text-pink-400" />}
                            Información General
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Nombre de la estación</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Slug</label>
                            <input
                                type="text"
                                value={station.slug}
                                disabled
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-slate-600 mt-1">Identificador único de la estación. No editable.</p>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Dominio personalizado</label>
                            <input
                                type="text"
                                value={data.custom_domain}
                                onChange={(e) => setData('custom_domain', e.target.value)}
                                placeholder="ej. radio.midominio.com"
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20"
                            />
                            <label htmlFor="is_active" className="text-sm text-slate-300">Estación activa</label>
                        </div>
                    </div>
                </div>

                {/* Streaming Settings */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-900">
                        <h3 className="text-sm font-bold text-slate-300">Configuración de Streaming</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        {isAudio && (
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Bitrate</label>
                                <select
                                    value={data.bitrate}
                                    onChange={(e) => setData('bitrate', parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value={64}>64 kbps</option>
                                    <option value={128}>128 kbps</option>
                                    <option value={192}>192 kbps</option>
                                    <option value={320}>320 kbps</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Máximo de oyentes</label>
                            <input
                                type="number"
                                value={data.max_listeners}
                                onChange={(e) => setData('max_listeners', parseInt(e.target.value))}
                                min={10}
                                max={5000}
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        {!isAudio && (
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Stream Key</label>
                                <input
                                    type="text"
                                    value={station.stream_key}
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Puerto</label>
                            <input
                                type="number"
                                value={station.port}
                                disabled
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                    <Save className="w-4 h-4" /> Guardar cambios
                </button>
            </form>
        </StationLayout>
    );
}
