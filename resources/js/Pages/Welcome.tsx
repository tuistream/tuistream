import { Head, usePage } from '@inertiajs/react';
import {
    Radio, Shield, Terminal, Zap, Layers, Server, Monitor, Globe,
    Play, Music, Video, HardDrive, BarChart3, ListMusic, Users,
    Cloud, Cpu, CheckCircle, ArrowRight, ChevronDown, Wifi,
    Tv, Disc, Headphones, Podcast, MousePointer, Sliders, Clock
} from 'lucide-react';
import { useState } from 'react';

export default function Welcome() {
    const { app } = usePage<any>().props;
    const appName = app?.name || 'TuiStream';
    const appLogo = app?.logo || null;

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
            <Head title={`${appName} — Streaming Profesional de Radio y TV por Internet`} />

            {/* Glowing Orbs background */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-10 right-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/4 rounded-full blur-3xl pointer-events-none" />

            {/* ================================================================ */}
            {/* NAVIGATION                                                       */}
            {/* ================================================================ */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-900/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 select-none">
                        {appLogo ? (
                            <img src={appLogo} alt={appName} className="max-h-9 max-w-[180px] object-contain" />
                        ) : (
                            <>
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                    <Radio className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                    {appName}
                                </span>
                            </>
                        )}
                    </div>
                    <nav className="flex items-center gap-4">
                        <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:inline">Características</a>
                        <a href="#docker" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:inline">Instalación</a>
                        <a
                            href="/login"
                            className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all shadow-md"
                        >
                            Acceder al Panel
                        </a>
                    </nav>
                </div>
            </header>

            {/* ================================================================ */}
            {/* HERO SECTION                                                     */}
            {/* ================================================================ */}
            <section className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8">
                    <Zap className="w-3.5 h-3.5" /> Radio + TV por Internet
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-[1.05]">
                    Tu Estación de{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                        Radio y TV
                    </span>
                    <br />
                    en Minutos, No en Días
                </h1>

                <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
                    {appName} instala automáticamente todo lo necesario — Icecast, SHOUTcast, Liquidsoap,
                    Nginx-RTMP y más — para que transmitas radio y televisión por internet
                    desde cualquier servidor o PC con Docker.
                </p>

                <div className="mt-10 flex flex-wrap gap-4 justify-center">
                    <a
                        href="/login"
                        className="px-6 py-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        Comenzar Ahora <ArrowRight className="w-4 h-4" />
                    </a>
                    <a
                        href="#docker"
                        className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold rounded-xl border border-slate-800 transition-all flex items-center gap-2"
                    >
                        <Terminal className="w-4 h-4 text-indigo-400" /> Comando de Instalación
                    </a>
                </div>

                {/* ============================================================ */}
                {/* DASHBOARD MOCKUP                                              */}
                {/* ============================================================ */}
                <div className="mt-20 w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/70" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <span className="w-3 h-3 rounded-full bg-green-500/70" />
                            <span className="text-xs text-slate-500 ml-2 font-mono hidden sm:inline">{appName.toLowerCase()}-panel-v1.0</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Docker Activo
                            </span>
                        </div>
                    </div>

                    {/* Dashboard cards preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-6">
                        <PreviewCard
                            icon={Cpu}
                            color="indigo"
                            label="CPU Servidor"
                            value="12.8%"
                            progress={13}
                        />
                        <PreviewCard
                            icon={Users}
                            color="violet"
                            label="Oyentes en Vivo"
                            value="1,847"
                            sub="▲ +8% vs ayer"
                            progress={0}
                        />
                        <PreviewCard
                            icon={Radio}
                            color="emerald"
                            label="Emisoras Radio"
                            value="18 / 25"
                            progress={72}
                        />
                        <PreviewCard
                            icon={Tv}
                            color="pink"
                            label="Canales TV"
                            value="6 / 10"
                            progress={60}
                        />
                    </div>

                    {/* Stations list preview */}
                    <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 text-left hidden lg:block">
                        <div className="flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-900">
                            <span className="flex-1">Estación</span>
                            <span className="w-16 text-center">Tipo</span>
                            <span className="w-20 text-center">Oyentes</span>
                            <span className="w-16 text-center">Estado</span>
                        </div>
                        <PreviewStationRow name="Radio Éxitos FM" type="Radio" listeners={342} online />
                        <PreviewStationRow name="Canal TV Noticias 24" type="TV" listeners={128} online />
                        <PreviewStationRow name="Jazz Lounge Stream" type="Radio" listeners={89} online />
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* 4 PILARES PRINCIPALES                                            */}
            {/* ================================================================ */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Todo lo que Necesitas para Emitir
                    </h2>
                    <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
                        Cuatro pilares que hacen de {appName} la plataforma más completa
                        para radio y televisión por internet.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pilar 1: Todo Incluido */}
                    <PillarCard
                        icon={Cloud}
                        color="indigo"
                        number="01"
                        title="Todo Está Incluido"
                        description={`${appName} instala y configura automáticamente Icecast 2 KH, SHOUTcast 2, Liquidsoap, Nginx-RTMP y todos los servicios necesarios para poner en marcha tu emisora de radio y canal de TV por internet en cuestión de minutos. Sin dependencias manuales, sin configuraciones complejas.`}
                        bullets={[
                            'Icecast 2 KH + SHOUTcast 2 preconfigurados',
                            'Liquidsoap AutoDJ con crossfade inteligente',
                            'Nginx-RTMP con HLS para streaming de video',
                            'Certificados SSL automáticos vía Let\'s Encrypt',
                        ]}
                    />

                    {/* Pilar 2: Poderoso e Intuitivo */}
                    <PillarCard
                        icon={MousePointer}
                        color="violet"
                        number="02"
                        title="Poderoso e Intuitivo"
                        description="Gestiona todos los aspectos de tu emisora de radio y canal de TV a través de una interfaz web moderna, responsive y fácil de usar. Diseñada para que tanto principiantes como expertos puedan controlar cada detalle sin complicaciones."
                        bullets={[
                            'Dashboard unificado con métricas en tiempo real',
                            'Panel de control con subpestañas organizadas',
                            'Estadísticas, reportes y gráficos detallados',
                            'Modo oscuro / claro con transiciones suaves',
                        ]}
                    />

                    {/* Pilar 3: En Cualquier Lugar */}
                    <PillarCard
                        icon={Server}
                        color="emerald"
                        number="03"
                        title="Se Puede Usar en Cualquier Lugar"
                        description={`Instala ${appName} en cualquier servidor Linux compatible con Docker, en un VPS económico, en un servidor dedicado de alto rendimiento, o incluso en tu propio PC de escritorio con Windows + Docker Desktop para desarrollo y pruebas locales.`}
                        bullets={[
                            'Compatible con Ubuntu, Debian, CentOS y más',
                            'Funciona en VPS, Dedicado y PC Local (Windows/Mac)',
                            'Arquitectura de microservicios con Docker Compose',
                            'Escalable: añade nodos geográficos adicionales',
                        ]}
                    />

                    {/* Pilar 4: Gestión Basada en Web */}
                    <PillarCard
                        icon={Layers}
                        color="pink"
                        number="04"
                        title="Gestión de Estaciones Basada en la Web"
                        description="Sube contenido multimedia, gestiona listas de reproducción, crea puntos de montaje locales y repetidores remotos, administra DJs y locutores, consulta análisis e informes detallados, y mucho más. Todo desde la comodidad de tu navegador web, sin necesidad de acceder por SSH."
                        bullets={[
                            'Subida de archivos multimedia (hasta 3 GB)',
                            'Listas de reproducción con rotación y horarios',
                            'DJ Manager: crea y gestiona cuentas de locutores',
                            'Widgets, embed codes, página pública personalizable',
                        ]}
                    />
                </div>
            </section>

            {/* ================================================================ */}
            {/* RADIO + TV SECTION                                                */}
            {/* ================================================================ */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900/60">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Radio y TV, Todo en Una Sola Plataforma
                    </h2>
                    <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
                        Dos tipos de streaming, una misma experiencia. Gestiona emisoras de radio
                        y canales de televisión desde el mismo panel unificado.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Radio Card */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                <Radio className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Streaming de Audio</h3>
                                <p className="text-sm text-slate-500">Emisoras de Radio por Internet</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <FeatureItem icon={Disc} text="Icecast 2 KH + SHOUTcast 2" />
                            <FeatureItem icon={Music} text="AutoDJ Liquidsoap con crossfade" />
                            <FeatureItem icon={ListMusic} text="Listas de reproducción inteligentes" />
                            <FeatureItem icon={Headphones} text="DJ Manager multi-locutor" />
                            <FeatureItem icon={BarChart3} text="Reportes de oyentes y canciones" />
                            <FeatureItem icon={Clock} text="Programación horaria de contenidos" />
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-900">
                            <span className="text-xs text-slate-500">
                                Slug: <code className="text-indigo-400 font-mono">/dashboard/station/</code>
                            </span>
                        </div>
                    </div>

                    {/* TV Card */}
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-pink-500/30 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                                <Tv className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Streaming de Video</h3>
                                <p className="text-sm text-slate-500">Canales de TV por Internet</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <FeatureItem icon={Video} text="Nginx-RTMP con HLS adaptativo" />
                            <FeatureItem icon={Globe} text="Página pública personalizable" />
                            <FeatureItem icon={Monitor} text="Embed codes iframe y JavaScript" />
                            <FeatureItem icon={Shield} text="Stream key privada por canal" />
                            <FeatureItem icon={BarChart3} text="Estadísticas GeoIP de audiencia" />
                            <FeatureItem icon={Sliders} text="Configuración de bitrate y calidad" />
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-900">
                            <span className="text-xs text-slate-500">
                                Slug: <code className="text-pink-400 font-mono">/dashboard/canaltv/</code>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* DOCKER INSTALL SECTION                                           */}
            {/* ================================================================ */}
            <section id="docker" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900/60">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                        <Terminal className="w-3.5 h-3.5" /> Instalación en 1 Comando
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Ejecuta en Cualquier Servidor con Docker
                    </h2>
                    <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
                        Compatible con Ubuntu, Debian, Windows (Docker Desktop) y cualquier
                        sistema con Docker y Docker Compose instalados.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Linux / VPS / Dedicado</p>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between group">
                            <code className="text-sm text-emerald-400 font-mono break-all">
                                git clone https://github.com/tuistream/tuistream.git &amp;&amp; cd tuistream &amp;&amp; docker compose up -d
                            </code>
                            <button
                                onClick={() => navigator.clipboard.writeText('git clone https://github.com/tuistream/tuistream.git && cd tuistream && docker compose up -d')}
                                className="ml-3 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">Windows (Docker Desktop)</p>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                            <code className="text-sm text-emerald-400 font-mono">
                                docker compose up -d
                            </code>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Icecast 2 KH
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> SHOUTcast 2
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Liquidsoap
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Nginx-RTMP + HLS
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> PostgreSQL
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Redis
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* CTA FINAL                                                        */}
            {/* ================================================================ */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900/60 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        ¿Listo para Emitir?
                    </h2>
                    <p className="mt-4 text-slate-400 text-lg">
                        Crea tu cuenta gratuita y ten tu primera emisora de radio
                        o canal de TV funcionando en menos de 5 minutos.
                    </p>
                    <div className="mt-10">
                        <a
                            href="/login"
                            className="px-8 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all inline-flex items-center gap-2 transform hover:-translate-y-0.5 text-lg"
                        >
                            Ir al Panel de Control <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </section>

            {/* ================================================================ */}
            {/* FOOTER                                                          */}
            {/* ================================================================ */}
            <footer className="max-w-7xl mx-auto px-6 py-12 relative z-10 border-t border-slate-900/60">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 select-none">
                        {appLogo ? (
                            <img src={appLogo} alt={appName} className="max-h-5 max-w-[100px] object-contain" />
                        ) : (
                            <Radio className="w-4 h-4 text-indigo-400" />
                        )}
                        <span>&copy; {new Date().getFullYear()} {appName}.</span>
                    </div>
                    <div className="flex gap-6 text-xs text-slate-600">
                        <a href="#features" className="hover:text-slate-400 transition-colors">Características</a>
                        <a href="#docker" className="hover:text-slate-400 transition-colors">Instalación</a>
                        <a href="/login" className="hover:text-indigo-400 transition-colors font-bold">Acceder</a>
                        <span>por <a href="https://hostuis.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors font-bold underline">Hostuis Group LLC</a></span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ============================================================================
   COMPONENTES AUXILIARES
   ============================================================================ */

function PillarCard({ icon: Icon, color, number, title, description, bullets }: {
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'violet' | 'emerald' | 'pink';
    number: string;
    title: string;
    description: string;
    bullets: string[];
}) {
    const colorMap = {
        indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/10' },
        violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/10' },
        emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
        pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', glow: 'shadow-pink-500/10' },
    };
    const c = colorMap[color];

    return (
        <div className={`rounded-2xl border border-slate-900 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-${color}-500/30 transition-all hover:shadow-xl ${c.glow} group`}>
            <div className="flex items-start gap-5">
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <span className="text-4xl font-black text-slate-800 group-hover:text-slate-700 transition-colors select-none">{number}</span>
                    <div className={`p-3 ${c.bg} ${c.border} border ${c.text} rounded-xl`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
                <div className="space-y-4 min-w-0">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
                    <ul className="space-y-2">
                        {bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle className={`w-3.5 h-3.5 ${c.text} shrink-0 mt-0.5`} />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-slate-300">
            <Icon className="w-4 h-4 text-slate-500" />
            <span>{text}</span>
        </div>
    );
}

function PreviewCard({ icon: Icon, color, label, value, sub, progress }: {
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'violet' | 'emerald' | 'pink';
    label: string;
    value: string;
    sub?: string;
    progress: number;
}) {
    const c = { indigo: 'text-indigo-400', violet: 'text-violet-400', emerald: 'text-emerald-400', pink: 'text-pink-400' };
    const bg = { indigo: 'bg-indigo-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', pink: 'bg-pink-500' };
    return (
        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {label}
                <Icon className={`w-4 h-4 ${c[color]}`} />
            </div>
            <div className="text-2xl font-extrabold font-mono">{value}</div>
            {progress > 0 && (
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className={`${bg[color]} h-full rounded-full`} style={{ width: `${progress}%` }} />
                </div>
            )}
            {sub && <div className="text-[10px] text-emerald-400 font-bold">{sub}</div>}
        </div>
    );
}

function PreviewStationRow({ name, type, listeners, online }: {
    name: string;
    type: string;
    listeners: number;
    online: boolean;
}) {
    return (
        <div className="flex gap-4 text-xs items-center py-2.5 border-b border-slate-900/50 last:border-0">
            <span className="flex-1 font-bold text-slate-200 flex items-center gap-2">
                {type === 'Radio' ? (
                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                    <Tv className="w-3.5 h-3.5 text-pink-400" />
                )}
                {name}
            </span>
            <span className="w-16 text-center text-slate-500">{type}</span>
            <span className="w-20 text-center font-mono font-bold text-slate-300">{listeners}</span>
            <span className="w-16 text-center">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase">
                    Online
                </span>
            </span>
        </div>
    );
}
