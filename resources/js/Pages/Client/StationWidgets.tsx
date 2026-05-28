import { Head, usePage } from '@inertiajs/react';
import { Link2, Globe, Copy, Check, Music, Radio } from 'lucide-react';
import { useState } from 'react';
import StationLayout from './StationLayout';

interface StationData {
    id: number;
    name: string;
    slug: string;
    type: 'audio' | 'video';
    port: number;
    frontend: string;
    stream_key: string;
}

interface UrlData {
    public_page: string;
    admin_url: string;
    stream_http: string;
    stream_https: string;
    hls_url: string | null;
}

interface PageProps {
    station: StationData;
    urls: UrlData;
}

export default function StationWidgets() {
    const { station, urls } = usePage<any>().props as PageProps;
    const isAudio = station.type === 'audio';
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const iframeCode = `<iframe width="100%" height="350" src="${urls.public_page}" frameborder="0" scrolling="no" allow="autoplay"></iframe>`;

    const domain = (station as any).server_domain || window.location.hostname;

    const externalPlayers = isAudio ? [
        { name: 'Winamp', icon: '🔊', url: `https://${domain}:${station.port}/radio.pls` },
        { name: 'VLC', icon: '▶️', url: `https://${domain}:${station.port}/radio.xspf` },
        { name: 'iTunes', icon: '🎵', url: `https://${domain}:${station.port}/radio.m3u` },
        { name: 'Windows Media Player', icon: '🎬', url: `https://${domain}:${station.port}/radio.asx` },
    ] : [];

    return (
        <StationLayout currentSection="widgets">
            <Head title={`${station.name} - Widgets y Enlaces`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                            <Link2 className="w-5 h-5" />
                        </div>
                        Widgets y Enlaces
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">URLs de servicio y códigos de inserción</p>
                </div>
            </div>

            <div className="space-y-6 max-w-3xl">
                {/* Service URLs */}
                <SectionCard title="URL de Servicio" icon={Globe}>
                    <div className="space-y-3">
                        <UrlRow label="Página pública" value={urls.public_page} onCopy={() => copyToClipboard(urls.public_page, 'public')} copied={copied === 'public'} />
                        <UrlRow label="URL del admin" value={urls.admin_url} onCopy={() => copyToClipboard(urls.admin_url, 'admin')} copied={copied === 'admin'} />
                        <UrlRow label="Stream HTTP" value={urls.stream_http} onCopy={() => copyToClipboard(urls.stream_http, 'http')} copied={copied === 'http'} />
                        <UrlRow label="Stream HTTPS" value={urls.stream_https} onCopy={() => copyToClipboard(urls.stream_https, 'https')} copied={copied === 'https'} />
                        {urls.hls_url && (
                            <UrlRow label="Stream HLS" value={urls.hls_url} onCopy={() => copyToClipboard(urls.hls_url!, 'hls')} copied={copied === 'hls'} />
                        )}
                    </div>
                </SectionCard>

                {/* Player Embed */}
                <SectionCard title="Código de inserción del reproductor HTML5" icon={Radio}>
                    <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto">
                            <code>{iframeCode}</code>
                        </div>
                        <button
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all"
                        >
                            {copied === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === 'iframe' ? 'Copiado' : 'Copiar código'}
                        </button>
                    </div>
                </SectionCard>

                {/* External Players */}
                {isAudio && externalPlayers.length > 0 && (
                    <SectionCard title="Enlaces generales" icon={Music}>
                        <div className="space-y-2">
                            {externalPlayers.map((player) => (
                                <div key={player.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-900">
                                    <span className="text-lg">{player.icon}</span>
                                    <span className="text-sm text-slate-300 font-medium flex-1">{player.name}</span>
                                    <button
                                        onClick={() => copyToClipboard(player.url, player.name)}
                                        className="px-2 py-1 text-[10px] font-semibold rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                                    >
                                        {copied === player.name ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </StationLayout>
    );
}

function SectionCard({ title, icon: Icon, children }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
            <div className="p-5 border-b border-slate-900">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400" /> {title}
                </h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function UrlRow({ label, value, onCopy, copied }: {
    label: string;
    value: string;
    onCopy: () => void;
    copied: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">{label}</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 truncate">
                    {value}
                </div>
            </div>
            <button
                onClick={onCopy}
                className="shrink-0 px-2.5 py-2 text-[10px] font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1"
            >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'OK' : 'Copiar'}
            </button>
        </div>
    );
}
