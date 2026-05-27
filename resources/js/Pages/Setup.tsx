import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle, XCircle, Loader2, ArrowRight, ArrowLeft,
    Shield, Radio, Tv, Server, Cpu, Database, Layers, Zap, Globe,
    Check, Eye, EyeOff, User, Mail, Lock
} from 'lucide-react';

interface CheckItem {
    ok: boolean;
    label: string;
    version?: string;
    error?: string;
}

interface PageProps {
    step: 'welcome' | 'account' | 'finish';
    checks?: Record<string, CheckItem>;
    flash?: { error?: string; success?: string };
}

export default function Setup() {
    const { step, checks, flash } = usePage<any>().props as PageProps;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
            <Head title="TuiStream — Asistente de Instalación" />

            <div className="w-full max-w-2xl">
                <div className="text-center mb-10 select-none">
                    <div className="inline-flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Radio className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            TuiStream
                        </span>
                    </div>
                </div>

                {/* Steps indicator */}
                <div className="flex justify-center gap-2 mb-10">
                    {['welcome', 'account', 'finish'].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                                step === s
                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-110'
                                    : ['welcome', 'account', 'finish'].indexOf(step) > i
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'bg-slate-900 border-slate-800 text-slate-600'
                            }`}>
                                {['welcome', 'account', 'finish'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            {i < 2 && (
                                <div className={`w-12 h-0.5 rounded-full transition-all ${
                                    ['welcome', 'account', 'finish'].indexOf(step) > i
                                        ? 'bg-emerald-500/40'
                                        : 'bg-slate-900'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content card */}
                <div className="rounded-3xl border border-slate-900 bg-slate-900/30 backdrop-blur-sm p-8 md:p-10 shadow-2xl">
                    {step === 'welcome' && <WelcomeStep checks={checks} />}
                    {step === 'account' && <AccountStep error={flash?.error} />}
                    {step === 'finish' && <FinishStep />}
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
   STEP 1: WELCOME — System checks
   ============================================================================ */

function WelcomeStep({ checks }: { checks?: Record<string, CheckItem> }) {
    const services = checks || {};
    const allOk = Object.values(services).every(c => c.ok);

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase mb-4">
                    <Zap className="w-3.5 h-3.5" /> Paso 1 de 3
                </div>
                <h2 className="text-2xl font-bold text-white">¡Bienvenido a TuiStream!</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    Verificando que todos los servicios estén funcionando correctamente antes de crear su cuenta de administrador.
                </p>
            </div>

            <div className="space-y-3">
                {Object.entries(services).map(([key, check]) => (
                    <div key={key}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                            check.ok
                                ? 'bg-emerald-500/5 border-emerald-500/15'
                                : 'bg-red-500/5 border-red-500/15'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {getServiceIcon(key)}
                            <div>
                                <span className="text-sm font-bold text-white">{check.label}</span>
                                {check.version && (
                                    <span className="text-[10px] text-slate-500 ml-2 font-mono">{check.version}</span>
                                )}
                            </div>
                        </div>
                        {check.ok ? (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">OK</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-red-400">
                                <XCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">FALLO</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                {allOk ? (
                    <a
                        href="/setup/account"
                        className="px-6 py-3 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
                    >
                        Continuar — Crear Cuenta <ArrowRight className="w-4 h-4" />
                    </a>
                ) : (
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-all"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" /> Reintentar verificación
                    </button>
                )}
            </div>
        </div>
    );
}

/* ============================================================================
   STEP 2: ACCOUNT — Create admin
   ============================================================================ */

function AccountStep({ error }: { error?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPass, setShowPass] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/setup/create-admin');
    };

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase mb-4">
                    <Shield className="w-3.5 h-3.5" /> Paso 2 de 3
                </div>
                <h2 className="text-2xl font-bold text-white">Crear Cuenta de Administrador</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                    Esta será la cuenta principal para gestionar todo el sistema TuiStream.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> {error}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4 max-w-md mx-auto">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        <User className="w-3 h-3 inline mr-1" /> Nombre Completo
                    </label>
                    <input
                        type="text"
                        required
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                    {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        <Mail className="w-3 h-3 inline mr-1" /> Correo Electrónico
                    </label>
                    <input
                        type="email"
                        required
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="admin@midominio.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                    {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        <Lock className="w-3 h-3 inline mr-1" /> Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={showPass ? 'text' : 'password'}
                            required
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all pr-10"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white transition-colors">
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-red-400 mt-1">{errors.password}</p>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        <Lock className="w-3 h-3 inline mr-1" /> Confirmar Contraseña
                    </label>
                    <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {processing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                    ) : (
                        <>Crear Cuenta de Administrador <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </form>
        </div>
    );
}

/* ============================================================================
   STEP 3: FINISH — Done!
   ============================================================================ */

function FinishStep() {
    return (
        <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase mb-6">
                <CheckCircle className="w-3.5 h-3.5" /> Paso 3 de 3
            </div>

            <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    <Check className="w-10 h-10 text-white" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">¡Configuración Completada!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Su cuenta de administrador ha sido creada exitosamente.
                TuiStream está listo para que comience a crear emisoras de radio
                y canales de televisión por internet.
            </p>

            <div className="mt-8 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 max-w-sm mx-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Servicios Activos</h3>
                <div className="grid grid-cols-2 gap-3 text-left">
                    <ServiceBadge icon={Radio} label="Icecast 2 KH" />
                    <ServiceBadge icon={Radio} label="SHOUTcast 2" />
                    <ServiceBadge icon={Layers} label="Liquidsoap" />
                    <ServiceBadge icon={Tv} label="Nginx-RTMP" />
                    <ServiceBadge icon={Database} label="PostgreSQL 17" />
                    <ServiceBadge icon={Zap} label="Redis 7" />
                    <ServiceBadge icon={Globe} label="SSL (Let's Encrypt)" />
                    <ServiceBadge icon={Server} label="Nginx Proxy" />
                </div>
            </div>

            <a
                href="/login"
                className="mt-8 px-8 py-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all inline-flex items-center gap-2"
            >
                Ir al Panel de Control <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    );
}

/* ============================================================================
   Helper Components
   ============================================================================ */

function getServiceIcon(key: string) {
    const iconMap: Record<string, React.ReactNode> = {
        postgresql: <Database className="w-5 h-5 text-blue-400" />,
        redis: <Zap className="w-5 h-5 text-red-400" />,
        icecast: <Radio className="w-5 h-5 text-emerald-400" />,
        shoutcast: <Radio className="w-5 h-5 text-amber-400" />,
        'nginx-rtmp': <Tv className="w-5 h-5 text-pink-400" />,
        liquidsoap: <Layers className="w-5 h-5 text-violet-400" />,
        php: <Cpu className="w-5 h-5 text-indigo-400" />,
        storage: <Server className="w-5 h-5 text-slate-400" />,
    };
    return iconMap[key] || <Server className="w-5 h-5 text-slate-500" />;
}

function ServiceBadge({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-300">
            <Icon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{label}</span>
        </div>
    );
}
