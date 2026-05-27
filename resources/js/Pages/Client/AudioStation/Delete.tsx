import { Head, useForm, usePage } from '@inertiajs/react';
import { Trash2, AlertOctagon } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationDelete() {
    const { station } = usePage<any>().props as unknown as PageProps;
    const { delete: destroy, processing } = useForm({});

    const handleDelete = (e: React.FormEvent) => {
        e.preventDefault();
        if (confirm(`¿Está COMPLETAMENTE seguro de eliminar permanentemente la radio "${station.name}"? Esta acción no se puede deshacer.`)) {
            destroy(`/dashboard/station/${station.id}/delete`);
        }
    };

    return (
        <AudioStationLayout currentSection="delete">
            <Head title={`${station.name} - Eliminar Servicio`} />

            <div className="max-w-2xl mx-auto mt-8">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm overflow-hidden p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl shrink-0">
                            <AlertOctagon className="w-8 h-8 animate-bounce" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                Eliminar Servicio
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                {station.name}
                            </p>
                        </div>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                        <p className="text-red-400 font-bold">¡ADVERTENCIA CRÍTICA!</p>
                        <p>Al eliminar de forma permanente este servicio de streaming de audio:</p>
                        <ul className="list-disc pl-5 space-y-1 text-slate-500 font-medium">
                            <li>Se apagarán todos los puertos e instancias de Icecast / Liquidsoap de inmediato.</li>
                            <li>Toda la configuración de la emisora se borrará permanentemente de la base de datos.</li>
                            <li>Se destruirán de forma definitiva todos los archivos musicales subidos a su disco virtual.</li>
                            <li><strong>Esta acción es irreversible y no se puede recuperar ningún dato.</strong></li>
                        </ul>
                    </div>

                    <form onSubmit={handleDelete} className="pt-4 border-t border-slate-900/50 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                        >
                            <Trash2 className="w-4 h-4" />
                            Confirmar Eliminación Definitiva
                        </button>
                    </form>
                </div>
            </div>
        </AudioStationLayout>
    );
}
