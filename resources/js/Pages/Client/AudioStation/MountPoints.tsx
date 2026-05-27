import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Disc, Plus, Edit, Trash2 } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationMountPoints() {
    const { station } = usePage<any>().props as PageProps;
    const [mountPoints, setMountPoints] = useState([
        { id: 1, path: '/radio.mp3', bitrate: 128, format: 'MP3', default: true },
        { id: 2, path: '/live.mp3', bitrate: 192, format: 'MP3', default: false },
    ]);

    return (
        <AudioStationLayout currentSection="mountpoints">
            <Head title={`${station.name} - Puntos de Montaje`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Disc className="w-4 h-4" />
                        </div>
                        Puntos de Montaje
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Configure los puntos de montaje de Icecast 2 KH (rutas públicas y de ingesta)</p>
                </div>

                <button
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Agregar Punto de Montaje
                </button>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/70 border-b border-slate-900 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                <th className="p-4">Ruta (Path)</th>
                                <th className="p-4">Bitrate</th>
                                <th className="p-4">Formato</th>
                                <th className="p-4">Predeterminado</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50 text-xs">
                            {mountPoints.map((mp) => (
                                <tr key={mp.id} className="hover:bg-slate-900/30 transition-all">
                                    <td className="p-4 font-mono font-bold text-indigo-400">{mp.path}</td>
                                    <td className="p-4 font-mono text-slate-300">{mp.bitrate} kbps</td>
                                    <td className="p-4 text-slate-400">{mp.format}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                            mp.default
                                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                : 'bg-slate-900 border-slate-800 text-slate-500'
                                        }`}>
                                            {mp.default ? 'Sí' : 'No'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-1">
                                        <button className="p-2 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-all">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={mp.default}
                                            className="p-2 hover:bg-red-500/10 disabled:opacity-30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AudioStationLayout>
    );
}
