import { useForm, Head, usePage } from '@inertiajs/react';
import { Radio, Lock, Mail, Loader2 } from 'lucide-react';
import { FormEvent, useEffect } from 'react';

export default function Login() {
    const { app, showRecaptcha, recaptchaSiteKey } = usePage<any>().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
        'g-recaptcha-response': '',
    });

    useEffect(() => {
        if (showRecaptcha && recaptchaSiteKey) {
            (window as any).onRecaptchaSuccess = (token: string) => {
                setData('g-recaptcha-response', token);
            };

            if (!(window as any).grecaptcha) {
                const script = document.createElement('script');
                script.src = 'https://www.google.com/recaptcha/api.js';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).onRecaptchaSuccess;
            }
        };
    }, [showRecaptcha, recaptchaSiteKey]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6 overflow-hidden">
            <Head title="Acceder" />

            {/* Background glowing gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-3xl" />

            {/* Login Card Container */}
            <div className="w-full max-w-md relative z-10">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-8 text-center select-none">
                    {app?.logo ? (
                        <img src={app.logo} alt="Logo" className="max-h-12 max-w-[200px] object-contain mb-4" />
                    ) : (
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 animate-pulse">
                            <Radio className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {app?.name || 'TuiStream'} Panel
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
                        Ingresa tus credenciales para acceder a tus emisoras de radio y TV
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] text-slate-600">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Icecast</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Liquidsoap</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Nginx-RTMP</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Docker</span>
                    </div>
                </div>

                {/* Glassmorphic Form Card */}
                <div className="bg-slate-900/45 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                    <Mail className="w-4 h-4" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-xs text-red-400 font-medium">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Contraseña
                                </label>
                                <a href="#forgot" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-650 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-xs text-red-400 font-medium">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-850 rounded focus:ring-indigo-500 focus:ring-offset-slate-950"
                            />
                            <label htmlFor="remember-me" className="ml-2 text-sm text-slate-400 select-none">
                                Recordar sesión
                            </label>
                        </div>

                        {showRecaptcha && recaptchaSiteKey && (
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-850 bg-slate-950/80 my-2">
                                <div
                                    className="g-recaptcha"
                                    data-sitekey={recaptchaSiteKey}
                                    data-theme="dark"
                                    data-callback="onRecaptchaSuccess"
                                />
                                {errors['g-recaptcha-response'] && (
                                    <p className="mt-2 text-xs text-red-400 font-medium">{errors['g-recaptcha-response']}</p>
                                )}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 px-4 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Accediendo...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                    </form>
                </div>

                {/* Footer Credits */}
                <p className="mt-8 text-center text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} TuiStream. Todos los derechos reservados. por <a href="https://hostuis.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 font-bold transition-all underline">Hostuis Group LLC</a>.
                </p>
            </div>
        </div>
    );
}
