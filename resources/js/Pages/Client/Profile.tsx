import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { User, Mail, Lock, Save, Radio, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '@/Components/ThemeToggle';

interface ClientData {
    id: number;
    name: string;
    email: string;
}

interface PageProps {
    client: ClientData;
    flash: {
        success?: string;
        error?: string;
    };
    auth: {
        user: {
            name: string;
            email: string;
            role: string;
        } | null;
    };
}

export default function ClientProfile() {
    const { client, flash, auth, app } = usePage<any>().props as any;
    const [saved, setSaved] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: client.name,
        email: client.email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/dashboard/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setSaved(true);
                reset('password', 'password_confirmation');
                setTimeout(() => setSaved(false), 3000);
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 overflow-x-hidden relative">
            <Head title="Mi Perfil - TuiStream" />

            {/* Glowing background */}
            <div className="fixed top-0 right-1/4 w-150 h-150 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-10 left-1/4 w-150 h-150 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-all">
                        {app?.logo ? (
                            <img src={app.logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900/50 p-0.5 border border-slate-800" />
                        ) : (
                            <div className="p-2 bg-linear-to-br from-indigo-500 to-violet-600 rounded-lg text-white">
                                <Radio className="w-5 h-5" />
                            </div>
                        )}
                        <div>
                            <span className="font-bold tracking-tight text-white text-base">{app?.name || 'TuiStream'}</span>
                            <span className="block text-[10px] text-slate-500 -mt-0.5">Panel de Cliente</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link
                            href="/dashboard"
                            className="px-3.5 py-2 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Panel
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 mt-8 relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-semibold"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver al panel de estaciones
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Client card details */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                {data.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{data.name}</h2>
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{data.email}</p>
                            </div>
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> Cliente Certificado
                            </span>
                        </div>
                    </div>

                    {/* Edit fields (8 cols) */}
                    <div className="md:col-span-8 space-y-6">
                        <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xs p-6">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-400" /> Mis Datos Personales
                            </h3>

                            {/* Flash success */}
                            {saved && flash?.success && (
                                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {flash.success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre Completo</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                            />
                                            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                                        </div>
                                        {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Correo Electrónico</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                            />
                                            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                                        </div>
                                        {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="border-t border-slate-900/50 my-6 pt-4 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5 text-indigo-400" /> Cambiar Contraseña (Opcional)
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nueva Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Dejar en blanco para mantener actual"
                                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                />
                                                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                                            </div>
                                            {errors.password && <p className="text-[10px] text-red-400 mt-1">{errors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Confirmar Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                                />
                                                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                                >
                                    <Save className="w-4 h-4" /> Guardar Cambios
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
