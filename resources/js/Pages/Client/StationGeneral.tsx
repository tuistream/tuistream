import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Power, RefreshCw, Users, Activity, HardDrive, Wifi,
    Video, Disc, Terminal, Radio, Copy, CheckCheck
} from 'lucide-react';
import StationLayout from './StationLayout';
import PlayerSelector from '@/Components/PlayerSelector';
import VideoJSReactPlayer from '@/Components/Players/VideoJSReactPlayer';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    status: string;
    port: number;
    dj_port: number;
    bitrate: number;
    max_listeners: number;
    frontend: string;
    stream_key: string;
    stream_url: string;
    hls_url: string | null;
    listeners: number;
    now_playing: string;
    storage_used_mb: number;
    storage_limit_mb: number;
    bandwidth_used_gb: number;
    bandwidth_limit_gb: number;
    is_active: boolean;
    custom_domain: string | null;
    server_node: string | null;
}

interface PageProps {
    station: StationData;
    isImpersonating: boolean;
    auth: { user: { name: string; email: string; role: string } | null };
    flash: { success?: string; error?: string };
}

export default function StationGeneral() {
    const { station, flash } = usePage<any>().props as PageProps;
    const isAudio = station.type === 'audio';

    const handleToggle = () => {
        router.post(`/dashboard/station/${station.id}/toggle`);
    };

    const handleRestart = () => {
        if (confirm('¿Reiniciar los servicios?')) {
            router.post(`/dashboard/station/${station.id}/restart`);
        }
    };

    const storagePercent = station.storage_limit_mb > 0
        ? Math.round((station.storage_used_mb / station.storage_limit_mb) * 100)
        : 0;
    const bwPercent = station.bandwidth_limit_gb > 0
        ? Math.round((station.bandwidth_used_gb / station.bandwidth_limit_gb) * 100)
        : 0;

    return (
        <StationLayout currentSection="show">
            <Head title={`${station.name} - Información General`} />

            {/* Flash */}
            {flash?.success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> {flash.error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${
                            isAudio
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                        }`}>
                            {isAudio ? <Disc className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </div>
                        {station.name}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isAudio ? `${station.frontend?.toUpperCase()} · ${station.bitrate} kbps` : 'RTMP → HLS'} · Puerto {station.port}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToggle}
                        className={`px-4 py-2.5 font-semibold rounded-xl flex items-center gap-2 transition-all text-sm ${
                            station.status === 'online'
                                ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                    >
                        <Power className="w-4 h-4" />
                        {station.status === 'online' ? 'Apagar' : 'Encender'}
                    </button>
                    <button
                        onClick={handleRestart}
                        disabled={station.status !== 'online'}
                        className="px-3 py-2.5 bg-slate-950 border border-slate-900 hover:bg-slate-900 disabled:opacity-40 text-slate-300 rounded-xl transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Oyentes" value={`${station.listeners} / ${station.max_listeners}`} icon={Users} color="indigo" />
                <StatCard label="Bitrate" value={`${station.bitrate} kbps`} icon={Activity} color="violet" />
                <StatCard label="Almacenamiento" value={`${station.storage_used_mb} / ${station.storage_limit_mb} MB`} icon={HardDrive} color="emerald" />
                <StatCard label="Ancho de Banda" value={`${station.bandwidth_used_gb} / ${station.bandwidth_limit_gb} GB`} icon={Wifi} color="amber" />
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <ProgressBar label="Uso de Disco" percent={storagePercent} color="emerald" />
                <ProgressBar label="Uso de Ancho de Banda" percent={bwPercent} color="amber" />
            </div>

            {/* Player + Connection Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Player */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-900 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Radio className="w-4 h-4 text-indigo-400" /> Reproductor
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            station.status === 'online'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-slate-950 border-slate-900 text-slate-500'
                        }`}>
                            {station.status}
                        </span>
                    </div>
                    <div className="p-5">
                        {station.status !== 'online' ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Power className="w-12 h-12 mb-3 opacity-30" />
                                <p className="font-semibold">Servicio apagado</p>
                                <p className="text-xs mt-1">Encienda la estación para escuchar o ver el stream.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">
                                        {isAudio ? 'Reproductor de Audio' : 'Reproductor de Video'}
                                    </p>
                                    <PlayerSelector />
                                </div>
                                <VideoJSReactPlayer
                                    src={isAudio ? station.stream_url : (station.hls_url || station.stream_url)}
                                    type={isAudio ? 'audio' : 'video'}
                                    title={station.now_playing}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Connection Info */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-900">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-violet-400" /> {isAudio ? 'Conexión DJ' : 'Ingesta RTMP'}
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {isAudio ? (
                            <>
                                <InfoRow label="Host" value={station.server_domain || window.location.hostname} />
                                <InfoRow label="Puerto DJ" value={`${station.dj_port}`} />
                                <InfoRow label="Mountpoint" value="/live" />
                                <InfoRow label="Contraseña" value={station.dj_password || `dj_${station.slug}`} highlight />
                            </>
                        ) : (
                            <>
                                <InfoRow label="URL RTMP" value={`rtmp://${station.server_domain || window.location.hostname}:${station.dj_port}/live`} />
                                <InfoRow label="Stream Key" value={station.stream_key} highlight />
                                <InfoRow label="Puerto" value={`${station.port}`} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </StationLayout>
    );
}

function StatCard({ label, value, icon: Icon, color }: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'violet' | 'emerald' | 'amber';
}) {
    const colors = {
        indigo: 'text-indigo-400',
        violet: 'text-violet-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
    };
    return (
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm flex flex-col gap-2">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${colors[color]}`} /> {label}
            </span>
            <span className="text-xl font-extrabold font-mono text-white">{value}</span>
        </div>
    );
}

function ProgressBar({ label, percent, color }: {
    label: string;
    percent: number;
    color: 'emerald' | 'amber';
}) {
    const barColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
    return (
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-mono font-bold text-white">{percent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
        </div>
    );
}

function InfoRow({ label, value, highlight = false }: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs flex items-center justify-between group">
            <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block mb-1">{label}</span>
                <span className={`${highlight ? 'text-indigo-400 font-bold' : 'text-slate-200'} select-all break-all block`}>{value}</span>
            </div>
            <button onClick={copy} className="ml-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}
