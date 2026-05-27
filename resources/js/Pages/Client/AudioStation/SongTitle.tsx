import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Music, Save, RefreshCw } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
    now_playing: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationSongTitle() {
    const { station } = usePage<any>().props as PageProps;
    const [title, setTitle] = useState(station.now_playing);
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setTimeout(() => {
            setUpdating(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }, 1000);
    };

    return (
        <AudioStationLayout currentSection="songtitle">
            <Head title={`${station.name} - Título de la canción`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Music className="w-4 h-4" />
                        </div>
                        Título de la Canción
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Actualice de manera manual el metadato del tema que se está emitiendo en tiempo real</p>
                </div>
            </div>

            <div className="max-w-xl">
                <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden p-5 space-y-4">
                    {success && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
                            Metadato del Stream actualizado correctamente.
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Título en Reproducción</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ej. Antony Santos - Voy Pa'llá"
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                        <p className="text-[9px] text-slate-600 mt-1">Este texto se enviará a Icecast para actualizar los reproductores web de los oyentes.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                        {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {updating ? 'Actualizando...' : 'Actualizar Metadato'}
                    </button>
                </form>
            </div>
        </AudioStationLayout>
    );
}
