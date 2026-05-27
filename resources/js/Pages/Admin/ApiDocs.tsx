import { Head, usePage } from '@inertiajs/react';
import {
    Code2, Copy, CheckCheck, ChevronDown, ChevronRight,
    Radio, Video, Users, Key, Zap, Shield, BookOpen,
    Terminal, Globe, Lock, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import AdminLayout from './Layout';

interface ApiToken { id: number; name: string; last_used: string; created_at: string; }

function CopyBtn({ text }: { text: string }) {
    const [ok, setOk] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
            className="p-1 rounded text-slate-600 hover:text-white transition-colors">
            {ok ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
    );
}

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    desc: string;
    auth: boolean;
    params?: Array<{ name: string; type: string; required: boolean; desc: string }>;
    response?: string;
}

const methodColor: Record<string, string> = {
    GET:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    POST:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    PUT:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
    DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const apiGroups = [
    {
        title: 'Estaciones',
        icon: Radio,
        color: 'text-indigo-400',
        endpoints: [
            { method: 'GET',    path: '/api/v1/stations',            desc: 'Listar todas las estaciones del cliente',  auth: true,
              response: '{"data":[{"id":1,"name":"Mi Radio","type":"audio","status":"online","listeners":42}]}' },
            { method: 'GET',    path: '/api/v1/stations/{id}',        desc: 'Obtener detalle de una estación',          auth: true,
              response: '{"id":1,"name":"Mi Radio","slug":"mi-radio","type":"audio","status":"online","bitrate":128,"port":8000}' },
            { method: 'POST',   path: '/api/v1/stations',             desc: 'Crear nueva estación',                     auth: true,
              params: [{ name:'name',type:'string',required:true,desc:'Nombre de la estación' },{ name:'type',type:'audio|video',required:true,desc:'Tipo de estación' }] },
            { method: 'PUT',    path: '/api/v1/stations/{id}',        desc: 'Actualizar estación',                      auth: true },
            { method: 'DELETE', path: '/api/v1/stations/{id}',        desc: 'Eliminar estación',                        auth: true },
            { method: 'GET',    path: '/api/v1/stations/{id}/stats',  desc: 'Estadísticas en tiempo real',              auth: true,
              response: '{"listeners":42,"bitrate":128,"status":"online","current_song":"Track Title - Artist"}' },
            { method: 'POST',   path: '/api/v1/stations/{id}/start',  desc: 'Iniciar stream de la estación',            auth: true },
            { method: 'POST',   path: '/api/v1/stations/{id}/stop',   desc: 'Detener stream de la estación',            auth: true },
            { method: 'POST',   path: '/api/v1/stations/{id}/restart','desc': 'Reiniciar servicio de la estación',      auth: true },
        ] as Endpoint[],
    },
    {
        title: 'Clientes',
        icon: Users,
        color: 'text-blue-400',
        endpoints: [
            { method: 'GET',    path: '/api/v1/clients',              desc: 'Listar todos los clientes',               auth: true,
              response: '{"data":[{"id":1,"name":"Juan García","email":"juan@example.com","stations_count":3}]}' },
            { method: 'POST',   path: '/api/v1/clients',              desc: 'Crear nuevo cliente',                     auth: true,
              params: [{ name:'name',type:'string',required:true,desc:'Nombre completo' },{ name:'email',type:'string',required:true,desc:'Correo electrónico' },{ name:'password',type:'string',required:true,desc:'Contraseña inicial' }] },
            { method: 'GET',    path: '/api/v1/clients/{id}',         desc: 'Detalle de cliente',                      auth: true },
            { method: 'PUT',    path: '/api/v1/clients/{id}',         desc: 'Actualizar cliente',                      auth: true },
            { method: 'DELETE', path: '/api/v1/clients/{id}',         desc: 'Eliminar cliente',                        auth: true },
        ] as Endpoint[],
    },
    {
        title: 'YouTube Downloader',
        icon: Zap,
        color: 'text-red-400',
        endpoints: [
            { method: 'POST',   path: '/api/v1/youtube/download',     desc: 'Encolar descarga desde YouTube',          auth: true,
              params: [{ name:'url',type:'string',required:true,desc:'URL de YouTube' },{ name:'format',type:'audio|video',required:true,desc:'Formato de descarga' },{ name:'quality',type:'string',required:false,desc:'128|192|320 para audio; 360p|720p|1080p para video' },{ name:'station_id',type:'integer',required:false,desc:'ID de estación destino' }] },
            { method: 'GET',    path: '/api/v1/youtube/jobs',          desc: 'Listar jobs de descarga activos',         auth: true },
            { method: 'GET',    path: '/api/v1/youtube/jobs/{jobId}',  desc: 'Estado de un job específico',             auth: true,
              response: '{"id":"abc123","status":"downloading","progress":67,"title":"Song Name"}' },
        ] as Endpoint[],
    },
    {
        title: 'Stream Events',
        icon: Globe,
        color: 'text-emerald-400',
        endpoints: [
            { method: 'POST',   path: '/api/v1/stream/{id}/on-publish',      desc: 'Hook: Stream comenzó (NGINX RTMP)',   auth: false },
            { method: 'POST',   path: '/api/v1/stream/{id}/on-publish-done', desc: 'Hook: Stream terminó',               auth: false },
            { method: 'GET',    path: '/api/v1/stream/{id}/status',          desc: 'Estado actual del stream',           auth: true,
              response: '{"online":true,"viewers":0,"rtmp_port":2935,"hls_url":"http://IP:8088/hls/live/slug.m3u8"}' },
        ] as Endpoint[],
    },
];

function EndpointRow({ ep }: { ep: Endpoint }) {
    const [open, setOpen] = useState(false);
    const curlExample = `curl -X ${ep.method} https://PANEL_DOMAIN${ep.path} \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json"`;
    return (
        <div className={`border-b border-slate-900/50 last:border-0 ${open ? 'bg-slate-900/30' : 'hover:bg-slate-900/20'} transition-all`}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-3 text-left">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border min-w-[52px] text-center ${methodColor[ep.method]}`}>{ep.method}</span>
                <code className="text-xs font-mono text-slate-300 flex-1">{ep.path}</code>
                {ep.auth && <span title="Requiere autenticación"><Lock className="w-3 h-3 text-slate-600 shrink-0" /></span>}
                <span className="text-[10px] text-slate-500 hidden md:block">{ep.desc}</span>
                {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            </button>
            {open && (
                <div className="px-5 pb-4 space-y-3">
                    <p className="text-xs text-slate-400">{ep.desc}</p>

                    {ep.params && ep.params.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Parámetros</p>
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="text-left text-[10px] text-slate-600 border-b border-slate-800">
                                        <th className="pb-1 pr-3">Nombre</th>
                                        <th className="pb-1 pr-3">Tipo</th>
                                        <th className="pb-1 pr-3">Req.</th>
                                        <th className="pb-1">Descripción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ep.params.map(p => (
                                        <tr key={p.name} className="border-b border-slate-900">
                                            <td className="py-1 pr-3 font-mono text-indigo-400">{p.name}</td>
                                            <td className="py-1 pr-3 text-slate-500 font-mono">{p.type}</td>
                                            <td className="py-1 pr-3">{p.required ? <span className="text-red-400 font-bold">sí</span> : <span className="text-slate-600">no</span>}</td>
                                            <td className="py-1 text-slate-400">{p.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {ep.response && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Respuesta de ejemplo</p>
                            <pre className="text-[10px] font-mono text-emerald-400 bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800">{ep.response}</pre>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">cURL</p>
                            <CopyBtn text={curlExample} />
                        </div>
                        <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800">{curlExample}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ApiDocs() {
    const { tokens = [], apiToken } = usePage<any>().props as { tokens: ApiToken[]; apiToken?: string };
    const [showToken, setShowToken] = useState(false);

    return (
        <AdminLayout currentPage="api-docs">
            <Head title="REST API — TuiStream Admin" />

            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <Code2 className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">REST API</h1>
                    <p className="text-sm text-slate-500">Documentación completa de la API REST de TuiStream v1</p>
                </div>
                <div className="ml-auto">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">v1.0.0</span>
                </div>
            </div>

            {/* Base URL + Auth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Base URL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-indigo-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex-1">
                            https://PANEL_DOMAIN/api/v1
                        </code>
                        <CopyBtn text="https://PANEL_DOMAIN/api/v1" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Autenticación</span>
                    </div>
                    <code className="text-[10px] font-mono text-amber-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 block">
                        Authorization: Bearer {'{'}.your_api_token{'}'}
                    </code>
                </div>
            </div>

            {/* API Token */}
            {apiToken && (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 mb-6 flex items-center gap-4">
                    <Key className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 mb-1">Tu API Token</p>
                        <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-indigo-300 truncate">
                                {showToken ? apiToken : '•'.repeat(40)}
                            </code>
                            <button onClick={() => setShowToken(!showToken)} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                                {showToken ? 'Ocultar' : 'Mostrar'}
                            </button>
                            <CopyBtn text={apiToken} />
                        </div>
                    </div>
                </div>
            )}

            {/* Endpoint Groups */}
            <div className="space-y-4">
                {apiGroups.map(group => (
                    <div key={group.title} className="rounded-2xl border border-slate-900 bg-slate-900/20 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-900 flex items-center gap-2">
                            <group.icon className={`w-4 h-4 ${group.color}`} />
                            <span className="text-xs font-bold text-slate-300">{group.title}</span>
                            <span className="ml-auto text-[10px] text-slate-600 font-mono">{group.endpoints.length} endpoints</span>
                        </div>
                        <div>
                            {group.endpoints.map((ep, i) => <EndpointRow key={i} ep={ep} />)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick start */}
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Start</span>
                </div>
                <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto leading-relaxed">
{`# 1. Obtén tu API token desde la configuración
# 2. Lista tus estaciones
curl https://PANEL_DOMAIN/api/v1/stations \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Obtén stats en tiempo real de una estación
curl https://PANEL_DOMAIN/api/v1/stations/1/stats \\
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Descarga audio de YouTube a una estación
curl -X POST https://PANEL_DOMAIN/api/v1/youtube/download \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://youtu.be/VIDEO_ID","format":"audio","quality":"320","station_id":1}'`}
                </pre>
            </div>
        </AdminLayout>
    );
}
