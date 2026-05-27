import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Link2, Globe, Copy, Check, Video, Code, Terminal } from 'lucide-react';
import VideoStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    slug: string;
    port: number;
    stream_key: string;
}

interface UrlData {
    public_page: string;
    admin_url: string;
    hls_url: string;
}

interface PageProps {
    station: StationData;
    urls: UrlData;
}

export default function VideoStationWidgets() {
    const { station, urls } = usePage<any>().props as PageProps;
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const iframeCode = `<iframe width="100%" height="480" src="${urls.public_page}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    const jsonCode = JSON.stringify({
        status: "success",
        data: {
            station_id: station.id,
            name: station.name,
            slug: station.slug,
            type: "video",
            status: "online",
            viewers: 1,
            stream_url: urls.hls_url,
            is_active: true
        }
    }, null, 4);

    return (
        <VideoStationLayout currentSection="widgets">
            <Head title={`${station.name} - Widgets y Enlaces`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                            <Link2 className="w-4 h-4" />
                        </div>
                        Widgets y Enlaces
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">URLs del canal, reproductor web e integración de API</p>
                </div>
            </div>

            <div className="space-y-6 max-w-3xl">
                {/* General Links */}
                <SectionCard title="General Links" icon={Globe}>
                    <div className="space-y-3.5">
                        <UrlRow label="Página pública de televisión" value={urls.public_page} onCopy={() => copyToClipboard(urls.public_page, 'public')} copied={copied === 'public'} />
                        <UrlRow label="URL del Administrador del Canal" value={urls.admin_url} onCopy={() => copyToClipboard(urls.admin_url, 'admin')} copied={copied === 'admin'} />
                        <UrlRow label="Dirección del Stream HLS (.m3u8)" value={urls.hls_url} onCopy={() => copyToClipboard(urls.hls_url, 'hls')} copied={copied === 'hls'} />
                    </div>
                </SectionCard>

                {/* Player Widgets */}
                <SectionCard title="Widgets" icon={Code}>
                    <div className="space-y-3.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Código de Inserción Iframe HTML5</span>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed select-all">
                            <code>{iframeCode}</code>
                        </div>
                        <button
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 flex items-center gap-1.5 transition-all"
                        >
                            {copied === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === 'iframe' ? 'Copiado' : 'Copiar Widget'}
                        </button>
                    </div>
                </SectionCard>

                {/* JSON Endpoint */}
                <SectionCard title="JSON API (Información en Tiempo Real)" icon={Terminal}>
                    <div className="space-y-3.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Ejemplo de Respuesta JSON</span>
                        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                            <pre>{jsonCode}</pre>
                        </div>
                        <button
                            onClick={() => copyToClipboard(jsonCode, 'json')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-all"
                        >
                            {copied === 'json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === 'json' ? 'Copiado' : 'Copiar JSON'}
                        </button>
                    </div>
                </SectionCard>
            </div>
        </VideoStationLayout>
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
                    <Icon className="w-4 h-4 text-pink-400" /> {title}
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
