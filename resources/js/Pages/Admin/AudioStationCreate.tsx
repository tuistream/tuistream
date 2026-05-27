import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Music, ArrowLeft, Save, User, Server, Zap, HardDrive,
    Key, Mic, Layers, Radio, RefreshCw
} from 'lucide-react';
import AdminLayout from './Layout';

interface Client { id: number; name: string; email: string; }
interface PageProps { clients: Client[]; next_port: number; }

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none';
const errorClass = 'text-[10px] text-red-400 mt-1';

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{children}</p>
        </div>
    );
}

const MEDIA_SERVERS = [
    { value: 'icecast_kh', label: 'Icecast KH' },
    { value: 'icecast',    label: 'Icecast 2'  },
    { value: 'shoutcast',  label: 'SHOUTcast 2' },
];

const AUTODJ_SERVICES = [
    { value: 'liquidsoap', label: 'Liquidsoap' },
    { value: 'none',       label: 'Sin AutoDJ'  },
];

export default function AudioStationCreate() {
    const { clients, next_port } = usePage<any>().props as PageProps;

    const { data, setData, post, processing, errors } = useForm({
        client_id:          '',
        station_name:       '',
        publish_name:       '',
        frontend:           'icecast_kh',
        port:               next_port || 8000,
        admin_password:     '',
        mountpoints:        1,
        autodj_sources:     1,       // 0 = unlimited
        bitrate:            128,
        max_listeners:      100,
        disk_space_limit:   -1,      // -1 = unlimited
        data_transfer_limit: -1,     // -1 = unlimited
        disk_space_mb:      10240,
        data_transfer_mb:   51200,
        autodj_service:     'liquidsoap',
    });

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
        let p = '';
        for (let i = 0; i < 14; i++) p += chars[Math.floor(Math.random() * chars.length)];
        setData('admin_password', p);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/audio/create-full');
    };

    return (
        <AdminLayout currentPage="audio">
            <Head title="Nueva Radio - Admin TuiStream" />

            <div className="mb-6">
                <Link href="/admin/audio" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a Audio Streaming
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <Music className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nueva Estación de Radio</h1>
                    <p className="text-sm text-slate-500 mt-1">Configura un nuevo servicio de audio streaming</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

                {/* ─── SERVICE INFORMATION ─────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    <SectionTitle icon={Server}>Información del Servicio</SectionTitle>

                    <div className="space-y-4">
                        {/* Client */}
                        <div>
                            <label className={labelClass}>Cliente <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select value={data.client_id} onChange={e => setData('client_id', e.target.value)} className={selectClass} required>
                                    <option value="">— Seleccionar cliente —</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                                <User className="absolute right-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                            </div>
                            {errors.client_id && <p className={errorClass}>{errors.client_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Station name */}
                            <div>
                                <label className={labelClass}>Nombre de la Emisora <span className="text-red-400">*</span></label>
                                <input type="text" value={data.station_name} onChange={e => setData('station_name', e.target.value)}
                                    placeholder="Radio Latino Mix" className={inputClass} required />
                                {errors.station_name && <p className={errorClass}>{errors.station_name}</p>}
                            </div>

                            {/* Publish name / mount */}
                            <div>
                                <label className={labelClass}>Publish Name <span className="text-slate-600 normal-case font-normal">(mount)</span></label>
                                <div className="relative">
                                    <input type="text" value={data.publish_name} onChange={e => setData('publish_name', e.target.value)}
                                        placeholder="/stream" className={inputClass + ' pl-10 font-mono'} />
                                    <Mic className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-600" />
                                </div>
                                {errors.publish_name && <p className={errorClass}>{errors.publish_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Media server */}
                            <div>
                                <label className={labelClass}>Media Server <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select value={data.frontend} onChange={e => setData('frontend', e.target.value)} className={selectClass}>
                                        {MEDIA_SERVERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                    <Radio className="absolute right-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                </div>
                                {errors.frontend && <p className={errorClass}>{errors.frontend}</p>}
                            </div>

                            {/* Port */}
                            <div>
                                <label className={labelClass}>Portbase <span className="text-slate-500 font-normal normal-case">(auto)</span></label>
                                <input type="number" value={data.port} onChange={e => setData('port', parseInt(e.target.value))}
                                    className={inputClass + ' font-mono'} required />
                                {errors.port && <p className={errorClass}>{errors.port}</p>}
                            </div>
                        </div>

                        {/* Admin password */}
                        <div>
                            <label className={labelClass}>Admin Password</label>
                            <div className="flex gap-2">
                                <input type="text" value={data.admin_password} onChange={e => setData('admin_password', e.target.value)}
                                    placeholder="Se generará automáticamente" className={inputClass + ' font-mono'} />
                                <button type="button" onClick={generatePassword} title="Generar contraseña"
                                    className="flex-shrink-0 px-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 transition-all">
                                    <Key className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── CAPACITY & AUDIO ─────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    <SectionTitle icon={Mic}>Capacidad y Audio</SectionTitle>

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Bitrate */}
                            <div>
                                <label className={labelClass}>Bitrate (Kbps) <span className="text-red-400">*</span></label>
                                <input type="number" min={256} max={99999} value={data.bitrate}
                                    onChange={e => setData('bitrate', parseInt(e.target.value))}
                                    placeholder="256 – 99999 Kbps" className={inputClass} required />
                                {errors.bitrate && <p className={errorClass}>{errors.bitrate}</p>}
                            </div>

                            {/* Mountpoints */}
                            <div>
                                <label className={labelClass}>
                                    Mountpoints — <span className="text-indigo-400 font-mono">{data.mountpoints}</span>
                                </label>
                                <input type="range" min={1} max={100} value={data.mountpoints}
                                    onChange={e => setData('mountpoints', parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-indigo-500 cursor-pointer mt-3" />
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1"><span>1</span><span>100</span></div>
                            </div>

                            {/* Max Connections slider */}
                            <div>
                                <label className={labelClass}>
                                    Max Connections — <span className="text-indigo-400 font-mono">{data.max_listeners.toLocaleString()}</span>
                                </label>
                                <input type="range" min={10} max={10000} step={10} value={data.max_listeners}
                                    onChange={e => setData('max_listeners', parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-indigo-500 cursor-pointer mt-3" />
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1"><span>10</span><span>10,000</span></div>
                            </div>
                        </div>

                        {/* AutoDJ Sources */}
                        <div>
                            <label className={labelClass}>AutoDJ Sources</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="autodj_sources" checked={data.autodj_sources === 0}
                                        onChange={() => setData('autodj_sources', 0)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Ilimitado</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="autodj_sources" checked={data.autodj_sources !== 0}
                                        onChange={() => setData('autodj_sources', 1)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Personalizado (1-100)</span>
                                </label>
                            </div>
                            {data.autodj_sources !== 0 && (
                                <div>
                                    <label className="text-[10px] text-slate-500 mb-1 block">
                                        Sources — <span className="text-indigo-400 font-mono">{data.autodj_sources}</span>
                                    </label>
                                    <input type="range" min={1} max={100} value={data.autodj_sources}
                                        onChange={e => setData('autodj_sources', parseInt(e.target.value))}
                                        className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-indigo-500 cursor-pointer" />
                                    <div className="flex justify-between text-[9px] text-slate-600 mt-1"><span>1</span><span>100</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── RESOURCES ────────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    <SectionTitle icon={HardDrive}>Recursos del Servicio</SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Storage */}
                        <div>
                            <label className={labelClass}>Storage</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="storage" checked={data.disk_space_limit === -1}
                                        onChange={() => setData('disk_space_limit', -1)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Unlimited</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="storage" checked={data.disk_space_limit !== -1}
                                        onChange={() => setData('disk_space_limit', data.disk_space_mb)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Personalizado</span>
                                </label>
                            </div>
                            {data.disk_space_limit !== -1 && (
                                <div className="flex items-center gap-2">
                                    <input type="number" min={1} value={data.disk_space_mb}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 1;
                                            setData(d => ({ ...d, disk_space_mb: v, disk_space_limit: v }));
                                        }} className={inputClass} />
                                    <span className="text-xs text-slate-500 shrink-0">MB</span>
                                </div>
                            )}
                        </div>

                        {/* Data Transfer */}
                        <div>
                            <label className={labelClass}>Data Transfer</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="data_transfer" checked={data.data_transfer_limit === -1}
                                        onChange={() => setData('data_transfer_limit', -1)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Unlimited</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="data_transfer" checked={data.data_transfer_limit !== -1}
                                        onChange={() => setData('data_transfer_limit', data.data_transfer_mb)} className="accent-indigo-500" />
                                    <span className="text-xs text-slate-300">Personalizado</span>
                                </label>
                            </div>
                            {data.data_transfer_limit !== -1 && (
                                <div className="flex items-center gap-2">
                                    <input type="number" min={1} value={data.data_transfer_mb}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 1;
                                            setData(d => ({ ...d, data_transfer_mb: v, data_transfer_limit: v }));
                                        }} className={inputClass} />
                                    <span className="text-xs text-slate-500 shrink-0">MB</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── AUTODJ SERVICE ───────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    <SectionTitle icon={Zap}>AutoDJ Service</SectionTitle>

                    <div className="flex flex-wrap gap-3">
                        {AUTODJ_SERVICES.map(s => (
                            <button key={s.value} type="button"
                                onClick={() => setData('autodj_service', s.value)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                    data.autodj_service === s.value
                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-400'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5" />
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-3">
                        Liquidsoap es el motor AutoDJ recomendado para gestión de playlists, jingles y programación.
                    </p>
                </div>

                {/* ─── SUBMIT ───────────────────────────────────────── */}
                <div className="flex items-center gap-3 pb-8">
                    <button type="submit" disabled={processing}
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5">
                        <Save className="w-4 h-4" /> Crear Estación de Radio
                    </button>
                    <Link href="/admin/audio"
                        className="px-5 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all">
                        Cancelar
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
