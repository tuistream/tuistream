import { Head, router } from '@inertiajs/react';
import { AlertCircle, LogOut, Radio } from 'lucide-react';

export default function NoStation() {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6 overflow-hidden">
            <Head title="Sin Emisora" />

            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10 text-center">
                <div className="bg-slate-900/45 border border-slate-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                    
                    <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight mb-3">Sin Emisora Asignada</h2>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        Tu cuenta ha sido creada exitosamente, pero el administrador aún no ha aprovisionado una emisora
                        de radio o canal de video para ti. Por favor, ponte en contacto con soporte técnico.
                    </p>

                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md"
                        >
                            Verificar Nuevamente
                        </button>
                        
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Cerrar Sesión
                        </button>
                    </div>

                </div>

                <div className="flex items-center justify-center gap-2 mt-8 text-slate-500">
                    <Radio className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wider uppercase">TuiStream Support</span>
                </div>
            </div>
        </div>
    );
}
