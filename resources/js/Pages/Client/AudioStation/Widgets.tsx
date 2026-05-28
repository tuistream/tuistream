import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Link2, Globe, Copy, Check, Radio, Music, Save } from 'lucide-react';
import AudioStationLayout from './Layout';

interface UrlData {
    public_page: string;
    admin_url: string;
    stream_http: string;
    stream_https: string;
    stream_proxy_url: string;
    m3u_playlist: string;
    listeners_url: string;
}

interface PageProps {
    station: any;
    urls: UrlData;
}

const apiHeaders = () => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
});

export default function AudioStationWidgets() {
    const { station, urls } = usePage<any>().props as PageProps;
    const [copied, setCopied] = useState<string | null>(null);
    const [editingUrls, setEditingUrls] = useState({ stream_proxy_url: urls.stream_proxy_url || '', m3u_playlist: urls.m3u_playlist || '', listeners_url: urls.listeners_url || '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const domain = station.server_domain || window.location.hostname;

    const iframeCode = `<iframe width="100%" height="150" src="${urls.public_page}" frameborder="0" scrolling="no" allow="autoplay"></iframe>`;

    const externalPlayers = [
        { name: 'Winamp', icon: '🔊', url: `https://${domain}:${station.port}/radio.pls` },
        { name: 'VLC', icon: '▶️', url: `https://${domain}:${station.port}/radio.xspf` },
        { name: 'iTunes', icon: '🎵', url: `https://${domain}:${station.port}/radio.m3u` },
        { name: 'Windows Media Player', icon: '🎬', url: `https://${domain}:${station.port}/radio.asx` },
    ];

    const saveWidgetSettings = async () => {
        setSaving(true);
        try {
            const r = await fetch(`/dashboard/station/${station.id}/widgets/save`, {
                method: 'POST',
                headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUrls),
            });
            if (r.ok) {
                setSaveMsg('Configuración guardada.');
                setTimeout(() => setSaveMsg(null), 3000);
            }
        } catch { setSaveMsg('Error al guardar.'); }
        finally { setSaving(false); }
    };

    return (
        <AudioStationLayout currentSection="widgets">
            <Head title={`${station.name} - Widgets y Enlaces`} />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl"><Link2 className="w-4 h-4" /></div>
                        Widgets y Enlaces
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Reproductores HTML e integraciones web para tu emisora</p>
                </div>
                <button onClick={saveWidgetSettings} disabled={saving} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all">
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar URLs'}
                </button>
            </div>

            {saveMsg && (
                <div className="mb-4 p-4 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span className="inline-block w-2 h-2 rounded-full mr-2 bg-emerald-400" />{saveMsg}
                </div>
            )}

            <div className="space-y-6 max-w-3xl">
                <SectionCard title="Enlaces Generales" icon={Globe}>
                    <div className="space-y-3.5">
                        <UrlRow label="Página pública de radio" value={urls.public_page} onCopy={() => copyToClipboard(urls.public_page, 'public')} copied={copied === 'public'} />
                        <UrlRow label="URL del Administrador" value={urls.admin_url} onCopy={() => copyToClipboard(urls.admin_url, 'admin')} copied={copied === 'admin'} />
                        <UrlRow label="Stream Directo HTTP" value={urls.stream_http} onCopy={() => copyToClipboard(urls.stream_http, 'http')} copied={copied === 'http'} />
                        <UrlRow label="Stream Directo HTTPS (Seguro)" value={urls.stream_https} onCopy={() => copyToClipboard(urls.stream_https, 'https')} copied={copied === 'https'} />
                    </div>
                </SectionCard>

                <SectionCard title="URLs Avanzadas" icon={Music}>
                    <div className="space-y-3.5">
                        <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Stream URL (Proxy)</span>
                            <input type="text" value={editingUrls.stream_proxy_url} onChange={e => setEditingUrls({...editingUrls, stream_proxy_url: e.target.value})}
                                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 outline-none focus:border-indigo-500"
                                placeholder="https://radio.midominio.com:8100/radio.mp3" />
                            <p className="text-[9px] text-slate-600 mt-1">URL del proxy/cortafuegos si el stream está detrás de uno.</p>
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">m3u Playlist</span>
                            <input type="text" value={editingUrls.m3u_playlist} onChange={e => setEditingUrls({...editingUrls, m3u_playlist: e.target.value})}
                                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 outline-none focus:border-indigo-500"
                                placeholder="https://radio.midominio.com:8100/radio.m3u" />
                        </div>
                        <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">URL de Oyentes (.xsl)</span>
                            <input type="text" value={editingUrls.listeners_url} onChange={e => setEditingUrls({...editingUrls, listeners_url: e.target.value})}
                                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 outline-none focus:border-indigo-500"
                                placeholder="https://radio.midominio.com:8100/status-json.xsl" />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Reproductor HTML5 (Widget)" icon={Radio}>
                    <div className="space-y-3.5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Código de inserción</span>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed select-all">
                            <code>{iframeCode}</code>
                        </div>
                        <button onClick={() => copyToClipboard(iframeCode, 'iframe')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all">
                            {copied === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied === 'iframe' ? 'Copiado' : 'Copiar Widget'}
                        </button>
                    </div>
                </SectionCard>

                <SectionCard title="Enlaces para Reproductores Externos" icon={Music}>
                    <div className="space-y-2">
                        {externalPlayers.map(player => (
                            <div key={player.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-900">
                                <span className="text-lg">{player.icon}</span>
                                <span className="text-xs text-slate-300 font-medium flex-1">{player.name}</span>
                                <button onClick={() => copyToClipboard(player.url, player.name)} className="px-2 py-1 text-[10px] font-semibold rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
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

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-slate-900 bg-slate-900/10">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2"><Icon className="w-4 h-4 text-indigo-400" /> {title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function UrlRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <span className="text-[9px] text-slate-500 uppercase font-bold block mb-0.5">{label}</span>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 font-mono text-xs text-slate-300 truncate select-all">{value}</div>
            </div>
            <button onClick={onCopy} className="shrink-0 px-2.5 py-2 text-[10px] font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Listo' : 'Copiar'}
            </button>
        </div>
    );
}
