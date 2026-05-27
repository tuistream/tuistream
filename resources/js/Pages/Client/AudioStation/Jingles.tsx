import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Volume2, Plus, Play, Music, Save, Settings } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationJingles() {
    const { station } = usePage<any>().props as PageProps;
    const [interval, setIntervalValue] = useState(4);
    const [jingles, setJingles] = useState([
        { id: 1, name: 'Identificación TuiStream Estéreo', filename: 'id_tuistream.mp3', duration: '12s' },
        { id: 2, name: 'Intro de Verano Voces Cruzadas', filename: 'verano_intro.mp3', duration: '18s' },
    ]);

    return (
        <AudioStationLayout currentSection="jingles">
            <Head title={`${station.name} - Jingles`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Volume2 className="w-4 h-4" />
                        </div>
                        Jingles e Identificación
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Programe identificaciones y cuñas publicitarias automáticas para que suenen entre canciones</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Rules & Interval Panel */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Reglas de Intervalo</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reproducir un Jingle cada (canciones):</label>
                                <input
                                    type="number"
                                    value={interval}
                                    onChange={(e) => setIntervalValue(parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
                                <Save className="w-4 h-4" /> Guardar Reglas
                            </button>
                        </div>
                    </div>
                </div>

                {/* Jingles Library */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-900 bg-slate-900/10 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Biblioteca de Jingles</h3>
                            <button className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Subir Jingle
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            {jingles.map((jingle) => (
                                <div key={jingle.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                            <Music className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-300 block">{jingle.name}</span>
                                            <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{jingle.filename}</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">{jingle.duration}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AudioStationLayout>
    );
}
