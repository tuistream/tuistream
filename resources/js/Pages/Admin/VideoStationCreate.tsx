import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Video, ArrowLeft, Save, User, Server, Zap, Eye, HardDrive,
    Database, Layers, Cast, Lock, Globe, RefreshCw, Plus, X, Tv,
    Radio, Play, Monitor, Info
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from './Layout';

interface Client {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    clients: Client[];
    next_port: number;
}

const BITRATES = [256, 320, 400, 480, 560, 640, 720, 800, 920, 1024, 1280, 1536, 1792, 2048, 2560, 3072, 3584, 4096, 4608, 5120, 5632, 6144, 6656, 7168, 7680, 8192, 9216, 10240, 11264, 12288, 13312, 14336, 99999];
const TRANSCODER_PROFILES = ['160p', '240p', '360p', '480p', '576p', '720p', '1080p', '4k', 'source'];
const STREAM_TARGET_PLATFORMS = ['Facebook', 'Youtube', 'RTMP', 'Kick', 'VK', 'Twitch', 'Telegram', 'Instagram'];

const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5';
const inputClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/20 transition-all';
const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/20 transition-all appearance-none';
const errorClass = 'text-[10px] text-red-400 mt-1';

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">{children}</p>
        </div>
    );
}

export default function VideoStationCreate() {
    const { clients, next_port } = usePage<any>().props as PageProps;

    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        station_name: '',
        service_type: 'live_streaming',
        port: next_port || 19200,
        stream_key: '',
        ftp_password: '',
        bitrate: 4000,
        max_listeners: 100,
        disk_space_limit: -1,
        data_transfer_limit: -1,
        disk_space_mb: 10240,
        data_transfer_mb: 51200,
        transcoder_profiles: [] as string[],
        stream_targets_limit: -1,
        stream_targets_count: 0,
        selected_platforms: [] as string[],
        geoip_locking: false,
        ndvr_rewind: false,
    });

    useEffect(() => {
        generateStreamKey();
        generatePassword();
    }, []);

    // Auto-generate random FTP password and stream key
    const generatePassword = () => {
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
        let pass = '';
        for (let i = 0; i < 16; i++) pass += chars[Math.floor(Math.random() * chars.length)];
        setData('ftp_password', pass);
    };

    const generateStreamKey = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 24; i++) key += chars[Math.floor(Math.random() * chars.length)];
        setData('stream_key', key);
    };

    const toggleProfile = (p: string) => {
        const current = data.transcoder_profiles as string[];
        if (current.includes(p)) {
            setData('transcoder_profiles', current.filter(x => x !== p));
        } else {
            setData('transcoder_profiles', [...current, p]);
        }
    };

    const togglePlatform = (p: string) => {
        const current = data.selected_platforms as string[];
        if (current.includes(p)) {
            setData('selected_platforms', current.filter(x => x !== p));
        } else {
            setData('selected_platforms', [...current, p]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/video/create-full');
    };

    return (
        <AdminLayout currentPage="video">
            <Head title="Nuevo Canal de Video - Admin TuiStream" />

            <div className="mb-6">
                <Link
                    href="/admin/video"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a Video Streaming
                </Link>
            </div>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                    <Video className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nuevo Canal de Video</h1>
                    <p className="text-sm text-slate-500 mt-1">Configura un nuevo servicio de video streaming</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

                {/* ─── SERVICE INFORMATION ─────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                    <SectionTitle icon={Server}>Información del Servicio</SectionTitle>

                    <div className="space-y-4">
                        {/* Client */}
                        <div>
                            <label className={labelClass}>Cliente <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select
                                    value={data.client_id}
                                    onChange={e => setData('client_id', e.target.value)}
                                    className={selectClass}
                                    required
                                >
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
                            {/* Service name */}
                            <div>
                                <label className={labelClass}>Nombre del Servicio <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={data.station_name}
                                    onChange={e => setData('station_name', e.target.value)}
                                    placeholder="Mi Canal HD"
                                    className={inputClass}
                                    required
                                />
                                {errors.station_name && <p className={errorClass}>{errors.station_name}</p>}
                            </div>

                            {/* Service type */}
                            <div>
                                <label className={labelClass}>Tipo de Servicio <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        value={data.service_type}
                                        onChange={e => setData('service_type', e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="live_streaming">📡 Live Streaming — Transmisión en Vivo (OBS, vMix, Wirecast)</option>
                                        <option value="tv_station">📺 TV Station — Web TV / AutoDJ de Video (Archivos + YouTube DL)</option>
                                        <option value="stream_relay">🔄 Stream Relay — Retransmitir otra fuente remota</option>
                                    </select>
                                    <Cast className="absolute right-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                </div>
                                {errors.service_type && <p className={errorClass}>{errors.service_type}</p>}
                            </div>
                        </div>

                        {/* Service type descriptions */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/50">
                            {data.service_type === 'live_streaming' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5">
                                        <Play className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Live Streaming</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                            El cliente transmite en vivo usando OBS Studio, vMix, Wirecast o cualquier encoder RTMP.
                                            Se genera una <strong className="text-pink-400">Stream Key</strong> única que debe configurarse en el encoder.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.service_type === 'tv_station' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg shrink-0 mt-0.5">
                                        <Tv className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">TV Station (Web TV)</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                            Reproduce videos automáticamente como un <strong className="text-violet-400">AutoDJ de Video</strong>.
                                            El cliente sube archivos o usa <strong className="text-violet-400">YouTube Downloader</strong> para descargar contenido y emitirlo 24/7.
                                            No necesita encoder externo.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.service_type === 'stream_relay' && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                                        <Radio className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Stream Relay</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                                            Retransmite una fuente de streaming externa (Icecast, SHOUTcast, RTMP).
                                            La estación actúa como repetidor de otra señal.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stream Key & FTP Password */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Live Streaming Key</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.stream_key}
                                        onChange={e => setData('stream_key', e.target.value)}
                                        placeholder="Se generará automáticamente"
                                        className={inputClass + ' font-mono'}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateStreamKey}
                                        title="Generar clave automáticamente"
                                        className="flex-shrink-0 px-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-pink-500/40 text-slate-400 hover:text-pink-400 transition-all"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>FTP Password</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={data.ftp_password}
                                        onChange={e => setData('ftp_password', e.target.value)}
                                        placeholder="Se generará automáticamente"
                                        className={inputClass + ' font-mono'}
                                    />
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        title="Generar contraseña automáticamente"
                                        className="flex-shrink-0 px-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-pink-500/40 text-slate-400 hover:text-pink-400 transition-all"
                                    >
                                        <Lock className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Port */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Puerto RTMP <span className="text-red-400">*</span></label>
                                <input
                                    type="number"
                                    value={data.port}
                                    onChange={e => setData('port', parseInt(e.target.value))}
                                    className={inputClass + ' font-mono'}
                                    required
                                />
                                {errors.port && <p className={errorClass}>{errors.port}</p>}
                            </div>

                            {/* Video Bitrate */}
                            <div>
                                <label className={labelClass}>Bitrate (Kbps) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select value={data.bitrate} onChange={e => setData('bitrate', parseInt(e.target.value))}
                                        className={selectClass}>
                                        {BITRATES.map(b => (
                                            <option key={b} value={b}>{b >= 1000 ? `${b / 1000} Mbps` : `${b} Kbps`}</option>
                                        ))}
                                    </select>
                                    <Play className="absolute right-3.5 top-3 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                                </div>
                                {errors.bitrate && <p className={errorClass}>{errors.bitrate}</p>}
                            </div>

                            {/* Viewers */}
                            <div>
                                <label className={labelClass}>
                                    Viewers — <span className="text-pink-400 font-mono">{data.max_listeners.toLocaleString()}</span>
                                </label>
                                <input
                                    type="range"
                                    min={10}
                                    max={10000}
                                    step={10}
                                    value={data.max_listeners}
                                    onChange={e => setData('max_listeners', parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-pink-500 cursor-pointer mt-3"
                                />
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                                    <span>10</span><span>10,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RESOURCES ───────────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                    <SectionTitle icon={HardDrive}>Recursos del Servicio</SectionTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Disk Space */}
                        <div>
                            <label className={labelClass}>Disk Space</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="disk_space"
                                        checked={data.disk_space_limit === -1}
                                        onChange={() => setData('disk_space_limit', -1)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Unlimited</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="disk_space"
                                        checked={data.disk_space_limit !== -1}
                                        onChange={() => setData('disk_space_limit', data.disk_space_mb)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Personalizado</span>
                                </label>
                            </div>
                            {data.disk_space_limit !== -1 && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.disk_space_mb}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 1;
                                            setData(d => ({ ...d, disk_space_mb: v, disk_space_limit: v }));
                                        }}
                                        className={inputClass}
                                    />
                                    <span className="text-xs text-slate-500 shrink-0">MB</span>
                                </div>
                            )}
                        </div>

                        {/* Data Transfer */}
                        <div>
                            <label className={labelClass}>Data Transfer</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="data_transfer"
                                        checked={data.data_transfer_limit === -1}
                                        onChange={() => setData('data_transfer_limit', -1)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Unlimited</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="data_transfer"
                                        checked={data.data_transfer_limit !== -1}
                                        onChange={() => setData('data_transfer_limit', data.data_transfer_mb)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Personalizado</span>
                                </label>
                            </div>
                            {data.data_transfer_limit !== -1 && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.data_transfer_mb}
                                        onChange={e => {
                                            const v = parseInt(e.target.value) || 1;
                                            setData(d => ({ ...d, data_transfer_mb: v, data_transfer_limit: v }));
                                        }}
                                        className={inputClass}
                                    />
                                    <span className="text-xs text-slate-500 shrink-0">MB</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── CONFIGURATIONS ──────────────────────────────────── */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
                    <SectionTitle icon={Zap}>Configuraciones</SectionTitle>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            {/* Transcoder Profiles (multiple) */}
                            <div>
                                <label className={labelClass}>Perfiles de Transcoder</label>
                                <p className="text-[9px] text-slate-600 mt-0.5 mb-3">
                                    Seleccione uno o más perfiles de calidad. Se generarán múltiples salidas HLS adaptativas.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'source', label: 'Source (Original)', desc: 'Sin transcodificar' },
                                        { key: '1080p', label: '1080p Full HD', desc: '1920×1080 @ 8 Mbps' },
                                        { key: '720p', label: '720p HD', desc: '1280×720 @ 5 Mbps' },
                                        { key: '480p', label: '480p SD', desc: '854×480 @ 2 Mbps' },
                                        { key: '360p', label: '360p', desc: '640×360 @ 1 Mbps' },
                                        { key: '240p', label: '240p', desc: '426×240 @ 500 Kbps' },
                                    ].map(({ key, label, desc }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleProfile(key)}
                                            className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                                                (data.transcoder_profiles as string[]).includes(key)
                                                    ? 'bg-pink-500/15 border-pink-500/40 text-pink-400 shadow-sm'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                            title={desc}
                                        >
                                            {label}
                                            {(data.transcoder_profiles as string[]).includes(key) && (
                                                <span className="ml-1.5 inline-flex"><X className="w-2.5 h-2.5" /></span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {errors.transcoder_profiles && <p className={errorClass}>{errors.transcoder_profiles}</p>}
                            </div>
                        </div>

                        {/* Stream Targets */}
                        <div>
                            <label className={labelClass}>Stream Targets</label>
                            <div className="flex gap-3 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="stream_targets"
                                        checked={data.stream_targets_limit === -1}
                                        onChange={() => setData('stream_targets_limit', -1)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Unlimited</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="stream_targets"
                                        checked={data.stream_targets_limit !== -1}
                                        onChange={() => setData('stream_targets_limit', data.stream_targets_count)}
                                        className="accent-pink-500"
                                    />
                                    <span className="text-xs text-slate-300">Personalizado (0-50)</span>
                                </label>
                            </div>
                            {data.stream_targets_limit !== -1 && (
                                <div className="mb-4">
                                    <label className="text-[10px] text-slate-500 mb-1 block">
                                        Máximo — <span className="text-pink-400 font-mono">{data.stream_targets_count}</span> destinos
                                    </label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={50}
                                        value={data.stream_targets_count}
                                        onChange={e => {
                                            const v = parseInt(e.target.value);
                                            setData(d => ({ ...d, stream_targets_count: v, stream_targets_limit: v }));
                                        }}
                                        className="w-full h-2 rounded-full appearance-none bg-slate-800 accent-pink-500 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                                        <span>0</span><span>50</span>
                                    </div>
                                </div>
                            )}

                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Plataformas habilitadas</label>
                            <div className="flex flex-wrap gap-2">
                                {STREAM_TARGET_PLATFORMS.map(p => {
                                    const selected = (data.selected_platforms as string[]).includes(p);
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => togglePlatform(p)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                                selected
                                                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            {selected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Toggles: GeoIP & nDVR */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* GeoIP */}
                            <div
                                onClick={() => setData('geoip_locking', !data.geoip_locking)}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                                    data.geoip_locking
                                        ? 'border-pink-500/40 bg-pink-500/10'
                                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                                }`}
                            >
                                <div className={`w-9 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${
                                    data.geoip_locking ? 'bg-pink-500' : 'bg-slate-700'
                                }`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                                        data.geoip_locking ? 'left-4' : 'left-0.5'
                                    }`} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-pink-400" />
                                        GeoIP Country Locking
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Bloqueo por país de origen</p>
                                </div>
                            </div>

                            {/* nDVR */}
                            <div
                                onClick={() => setData('ndvr_rewind', !data.ndvr_rewind)}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                                    data.ndvr_rewind
                                        ? 'border-pink-500/40 bg-pink-500/10'
                                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                                }`}
                            >
                                <div className={`w-9 h-5 rounded-full relative transition-all duration-300 flex-shrink-0 ${
                                    data.ndvr_rewind ? 'bg-pink-500' : 'bg-slate-700'
                                }`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                                        data.ndvr_rewind ? 'left-4' : 'left-0.5'
                                    }`} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                        <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
                                        nDVR Rewind
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Rebobinado en tiempo real</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── SUBMIT ──────────────────────────────────────────── */}
                <div className="flex items-center gap-3 pb-8">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 transform hover:-translate-y-0.5"
                    >
                        <Save className="w-4 h-4" /> Crear Canal de Video
                    </button>
                    <Link
                        href="/admin/video"
                        className="px-5 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </AdminLayout>
    );
}
