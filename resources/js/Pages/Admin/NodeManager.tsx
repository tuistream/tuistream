import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Globe, Server, Cpu, MemoryStick, Wifi, Plus,
    CheckCircle, XCircle, AlertCircle, Settings,
    MapPin, Trash2, Loader2, Radio, Video, Layers,
    Activity, BarChart3, ArrowUpDown, Users
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from './Layout';

interface Node {
    id: number;
    name: string;
    ip: string;
    type: 'audio' | 'video' | 'transcoding';
    region: string;
    country_codes: string[];
    status: 'online' | 'offline' | 'degraded';
    cpu_usage: number;
    ram_usage: number;
    bandwidth_mbps: number;
    stations_count: number;
    max_stations: number;
    latency_ms: number;
    uptime_pct: number;
}

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all appearance-none';

const regionLabels: Record<string, string> = {
    'latam':  '🌎 América Latina',
    'us':     '🇺🇸 Estados Unidos',
    'eu':     '🇪🇺 Europa',
    'asia':   '🌏 Asia Pacífico',
    'custom': '📍 Personalizado',
};

const typeConfig = {
    audio:       { label: 'Audio Node',       icon: Radio,  cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    video:       { label: 'Video Node',       icon: Video,  cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    transcoding: { label: 'Transcoding Node', icon: Layers, cls: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const statusConfig = {
    online:   { icon: CheckCircle, cls: 'text-emerald-400',  label: 'Online',   dotCls: 'bg-emerald-400 animate-pulse' },
    offline:  { icon: XCircle,     cls: 'text-red-400',     label: 'Offline',  dotCls: 'bg-red-400' },
    degraded: { icon: AlertCircle, cls: 'text-amber-400',   label: 'Degradado',dotCls: 'bg-amber-400 animate-pulse' },
};

function UsageBar({ value, warn = 70, crit = 90 }: { value: number; warn?: number; crit?: number }) {
    const color = value >= crit ? 'bg-red-500' : value >= warn ? 'bg-amber-500' : 'bg-emerald-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
            </div>
            <span className="text-[10px] font-mono text-slate-500 w-8">{value}%</span>
        </div>
    );
}

export default function NodeManager() {
    const { nodes: initialNodes = [] } = usePage<any>().props as { nodes: Node[] };
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        name:          '',
        ip:            '',
        type:          'audio',
        region:        'latam',
        country_codes: '',
        max_stations:  50,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/nodes', { onSuccess: () => { reset(); setShowForm(false); } });
    };

    // Summary stats
    const totalOnline = nodes.filter(n => n.status === 'online').length;
    const avgCpu = nodes.length ? Math.round(nodes.reduce((a, n) => a + n.cpu_usage, 0) / nodes.length) : 0;
    const totalBw = nodes.reduce((a, n) => a + n.bandwidth_mbps, 0);
    const totalStations = nodes.reduce((a, n) => a + n.stations_count, 0);

    return (
        <AdminLayout currentPage="nodes">
            <Head title="Nodos & Geo-Balanceo — TuiStream Admin" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                    <Globe className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nodos & Geo-Balanceo</h1>
                    <p className="text-sm text-slate-500">Gestiona servidores y distribución geográfica del tráfico de streaming</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="ml-auto px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Agregar Nodo
                </button>
            </div>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Nodos Online', value: `${totalOnline}/${nodes.length}`, icon: Server, cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'CPU Promedio', value: `${avgCpu}%`, icon: Cpu, cls: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Bandwidth Total', value: `${totalBw} Mbps`, icon: Wifi, cls: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Estaciones Activas', value: totalStations, icon: Activity, cls: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                        <div className={`inline-flex p-2 rounded-xl border mb-3 ${s.bg}`}>
                            <s.icon className={`w-4 h-4 ${s.cls}`} />
                        </div>
                        <p className="text-2xl font-black text-white">{s.value}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Add Node Form ── */}
            {showForm && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 mb-6">
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-400" /> Agregar Nuevo Nodo
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Nombre del Nodo</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                placeholder="Miami Node 01" className={inputClass} required />
                            {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>IP / Hostname</label>
                            <input type="text" value={data.ip} onChange={e => setData('ip', e.target.value)}
                                placeholder="192.168.1.100" className={inputClass} required />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo de Nodo</label>
                            <select value={data.type} onChange={e => setData('type', e.target.value)} className={selectClass}>
                                <option value="audio">Audio Node (Icecast/SHOUTcast)</option>
                                <option value="video">Video Node (NGINX RTMP)</option>
                                <option value="transcoding">Transcoding Node (FFmpeg)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Región</label>
                            <select value={data.region} onChange={e => setData('region', e.target.value)} className={selectClass}>
                                {Object.entries(regionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Países (códigos, separados por coma)</label>
                            <input type="text" value={data.country_codes} onChange={e => setData('country_codes', e.target.value)}
                                placeholder="CO, MX, AR, PE, VE" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Máx. Estaciones</label>
                            <input type="number" value={data.max_stations} onChange={e => setData('max_stations', parseInt(e.target.value))}
                                min={1} max={999} className={inputClass} />
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all">
                                Cancelar
                            </button>
                            <button type="submit" disabled={processing}
                                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Agregar Nodo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Nodes Table ── */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500" />
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Servidores de Streaming</h2>
                </div>

                {nodes.length === 0 ? (
                    <div className="text-center py-20">
                        <Globe className="w-14 h-14 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Sin nodos configurados</p>
                        <p className="text-slate-600 text-xs mt-1">Agrega tu primer servidor de streaming con el botón de arriba</p>
                        <button onClick={() => setShowForm(true)}
                            className="mt-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all">
                            + Agregar primer nodo
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                    <th className="p-4">Nodo</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Región / Países</th>
                                    <th className="p-4">CPU</th>
                                    <th className="p-4">RAM</th>
                                    <th className="p-4">Bandwidth</th>
                                    <th className="p-4">Estaciones</th>
                                    <th className="p-4">Latencia</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/50">
                                {nodes.map(node => {
                                    const sc = statusConfig[node.status];
                                    const tc = typeConfig[node.type];
                                    return (
                                        <tr key={node.id} className="hover:bg-slate-900/30 transition-all text-sm">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-200 text-sm">{node.name}</p>
                                                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{node.ip}</p>
                                                <p className="text-[10px] text-slate-600 mt-0.5">Uptime: {node.uptime_pct}%</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${tc.cls}`}>
                                                    <tc.icon className="w-3 h-3" /> {tc.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs text-slate-300">{regionLabels[node.region] ?? node.region}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {node.country_codes.slice(0, 5).map(c => (
                                                        <span key={c} className="text-[9px] font-mono px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-500">{c}</span>
                                                    ))}
                                                    {node.country_codes.length > 5 && <span className="text-[9px] text-slate-600">+{node.country_codes.length - 5}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 w-28">
                                                <UsageBar value={node.cpu_usage} />
                                            </td>
                                            <td className="p-4 w-28">
                                                <UsageBar value={node.ram_usage} />
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-mono text-slate-300">{node.bandwidth_mbps} <span className="text-slate-600">Mbps</span></p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-mono text-slate-300">{node.stations_count} <span className="text-slate-600">/ {node.max_stations}</span></p>
                                                <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(node.stations_count / node.max_stations) * 100}%` }} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-mono ${node.latency_ms < 50 ? 'text-emerald-400' : node.latency_ms < 150 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {node.latency_ms} ms
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${sc.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`} />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all" title="Configurar">
                                                        <Settings className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleting(node.id)}
                                                        className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        title="Eliminar Nodo">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Geo-routing info card */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300">¿Cómo funciona el Geo-Balanceo?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-400 leading-relaxed">
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">1</span>
                        <p>El oyente accede al player y el sistema detecta su país de origen usando la IP.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">2</span>
                        <p>Se busca el nodo asignado al país del oyente. Si no hay nodo específico, se usa el de la región más cercana.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">3</span>
                        <p>El oyente se conecta al nodo óptimo, reduciendo latencia y distribuyendo la carga entre servidores.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
