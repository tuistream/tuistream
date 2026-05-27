import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Link2, Globe, Copy, Check, Radio, Music } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    port: number;
}

interface UrlData {
    public_page: string;
    admin_url: string;
    stream_http: string;
    stream_https: string;
}

interface PageProps {
    station: StationData;
    urls: UrlData;
}

export default function AudioStationWidgets() {
    const { station, urls } = usePage<any>().props as PageProps;
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const iframeCode = `<iframe width="100%" height="150" src="${urls.public_page}" frameborder="0" scrolling="no" allow="autoplay"></iframe>`;

    const externalPlayers = [
        { name: 'Winamp', icon: '🔊', url: `https://stream.tuistream.com:${station.port}/radio.pls` },
        { name: 'VLC', icon: '▶️', url: `https://stream.tuistream.com:${station.port}/radio.xspf` },
        { name: 'iTunes', icon: '🎵', url: `https://stream.tuistream.com:${station.port}/radio.m3u` },
        { name: 'Windows Media Player', icon: '🎬', url: `https://stream.tuistream.com:${station.port}/radio.asx` },
    ];

    return (
        <AudioStationLayout currentSection="widgets">
            <Head title={`${station.name} - Widgets y Enlaces`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Link2 className="w-4 h-4" />
                        </div>
                        Widgets y Enlaces
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Obtenga los reproductores HTML e integraciones web para su emisora</p>
                </div>
            </div>

            <div className="space-y-6 max-w-3xl">
                {/* General Links */}
                <SectionCard title="Your Station (Enlaces Generales)" icon={Globe}>
                    <div className="space-y-3.5">
                        <UrlRow label="Página pública de radio" value={urls.public_page} onCopy={() => copyToClipboard(urls.public_page, 'public')} copied={copied === 'public'} />
                        <UrlRow label="URL del Administrador" value={urls.admin_url} onCopy={() => copyToClipboard(urls.admin_url, 'admin')} copied={copied === 'admin'} />
                        <UrlRow label="Stream Directo HTTP" value={urls.stream_http} onCopy={() => copyToClipboard(urls.stream_http, 'http')} copied={copied === 'http'} />
                        <UrlRow label="Stream Directo HTTPS (Seguro)" value={urls.stream_https} onCopy={() => copyToClipboard(urls.stream_https, 'https')} copied={copied === 'https'} />
                    </div>
                </SectionCard>

                {/* Player Embed */}
                <SectionCard title="Widgets" icon={Radio}>
                    <div className="space-y-3.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Código de inserción del reproductor HTML5</span>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed select-all">
                            <code>{iframeCode}</code>
                        </div>
                        <button
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all"
                        >
                            {copied === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === 'iframe' ? 'Copiado' : 'Copiar Widget'}
                        </button>
                    </div>
                </SectionCard>

                {/* External Players */}
                <SectionCard title="Enlaces para Reproductores Externos" icon={Music}>
                    <div className="space-y-2">
                        {externalPlayers.map((player) => (
                            <div key={player.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-900">
                                <span className="text-lg">{player.icon}</span>
                                <span className="text-xs text-slate-300 font-medium flex-1">{player.name}</span>
                                <button
                                    onClick={() => copyToClipboard(player.url, player.name)}
                                    className="px-2 py-1 text-[10px] font-semibold rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
                                >
                                    {copied === player.name ? 'Copiado' : 'Copiar Enlace'}
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </AudioStationLayout>
    );
}

function SectionCard({ title, icon: Icon, children }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-slate-900 bg-slate-900/10">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-400" /> {title}
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
                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">{label}</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 truncate select-all">
                    {value}
                </div>
            </div>
            <button
                onClick={onCopy}
                className="shrink-0 px-2.5 py-2 text-[10px] font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1"
            >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Listo' : 'Copiar'}
            </button>
        </div>
    );
}
