import { Head, useForm, usePage } from '@inertiajs/react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    is_active: boolean;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationSuspend() {
    const { station } = usePage<any>().props as unknown as PageProps;
    const { post, processing } = useForm({});

    const handleSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/dashboard/station/${station.id}/suspend`);
    };

    return (
        <AudioStationLayout currentSection="suspend">
            <Head title={`${station.name} - Suspender Servicio`} />

            <div className="max-w-2xl mx-auto mt-8">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm overflow-hidden p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                            <AlertTriangle className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                {station.is_active ? 'Suspender el Servicio' : 'Reactivar el Servicio'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                {station.name}
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                        {station.is_active ? (
                            <>
                                <p>Al suspender temporalmente el servicio:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                                    <li>La radio en vivo y el AutoDJ se apagarán de inmediato.</li>
                                    <li>Los reproductores insertados en páginas web externas mostrarán un estado de desconexión.</li>
                                    <li>Sus DJs locutores no podrán conectarse para transmitir en directo.</li>
                                    <li><strong>No perderá su música ni configuraciones.</strong> Podrá reactivar la radio en cualquier momento.</li>
                                </ul>
                            </>
                        ) : (
                            <p>Su emisora de radio se encuentra suspendida. Reactívela para encender el AutoDJ y permitir conexiones de locución en directo de inmediato.</p>
                        )}
                    </div>

                    <form onSubmit={handleSuspend} className="pt-4 border-t border-slate-900/50 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                                station.is_active
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                        >
                            {station.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            {station.is_active ? 'Confirmar Suspensión' : 'Reactivar Servicio'}
                        </button>
                    </form>
                </div>
            </div>
        </AudioStationLayout>
    );
}
