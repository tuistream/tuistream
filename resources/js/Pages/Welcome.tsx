import { Head } from '@inertiajs/react';
import { Radio, Shield, Terminal, Zap, Layers, Server } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
            <Head title="Bienvenido" />

            {/* Glowing Orbs background */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/75 border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Radio className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            TuiStream
                        </span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">
                            Características
                        </a>
                        <a
                            href="/login"
                            className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all"
                        >
                            Acceder al Panel
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative z-10 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
                    <Zap className="w-3.5 h-3.5" /> Alternativa Moderna a MediaCP y AzuraCast
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-none">
                    Alojamiento de Streaming{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                        Profesional e Increíble
                    </span>
                </h1>

                <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
                    TuiStream es una plataforma SaaS modular y multiusuario auto-instalable por SSH. Orquesta tus emisoras
                    con Docker de manera aislada, rápida y sin requerir paneles de control externos.
                </p>

                <div className="mt-10 flex flex-wrap gap-4 justify-center">
                    <a
                        href="/login"
                        className="px-6 py-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        Comenzar Ahora
                    </a>
                    <a
                        href="#docs"
                        className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-850 text-slate-300 font-medium rounded-xl border border-slate-800 transition-all flex items-center gap-2"
                    >
                        <Terminal className="w-4 h-4 text-indigo-400" /> Ver Instalador SSH
                    </a>
                </div>

                {/* Dashboard Mockup Preview */}
                <div className="mt-20 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/70" />
                            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <span className="w-3 h-3 rounded-full bg-green-500/70" />
                            <span className="text-xs text-slate-500 ml-2 font-mono">tuistream-panel-v1.0.0</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Servidor Activo
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                                CPU Servidor
                                <Server className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono">14.2%</div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full w-[14%]" />
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                                Oyentes en Directo
                                <Radio className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono">1,482</div>
                            <div className="text-xs text-emerald-400 font-medium">▲ +12% vs última hora</div>
                        </div>

                        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                                Emisoras Aprovisionadas
                                <Layers className="w-4 h-4 text-pink-400" />
                            </div>
                            <div className="text-3xl font-bold font-mono">24 / 30</div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-full rounded-full w-[80%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Features Grid */}
                <section id="features" className="mt-32 w-full text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-center mb-4">
                        Diseñado para la Siguiente Generación de Streaming
                    </h2>
                    <p className="text-slate-400 text-center max-w-xl mx-auto mb-16">
                        Todo lo que necesitas para ejecutar un negocio de hosting de streaming de alto rendimiento.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition-all hover:shadow-lg hover:shadow-indigo-500/[0.02] flex flex-col gap-4">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl w-fit">
                                <Radio className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Icecast & AutoDJ</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Aprovisionamiento automático de puntos de montaje y servidores dedicados Liquidsoap para reproducir sin interrupciones.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition-all hover:shadow-lg hover:shadow-indigo-500/[0.02] flex flex-col gap-4">
                            <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl w-fit">
                                <Layers className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Contenedores Aislados</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Aislamiento total de recursos mediante Docker por estación. Máxima seguridad y prevención de caídas generales.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition-all hover:shadow-lg hover:shadow-indigo-500/[0.02] flex flex-col gap-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl w-fit">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Multiusuario y SaaS</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Roles jerárquicos: Super Admins, Revendedores, Clientes, Gerentes de Estación y DJs. Todo aislado.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 transition-all hover:shadow-lg hover:shadow-indigo-500/[0.02] flex flex-col gap-4">
                            <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl w-fit">
                                <Terminal className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold">Instalador Desatendido</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Listo para desplegar en VPS limpios de Ubuntu o Debian con una sola línea de código a través de terminal SSH.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
