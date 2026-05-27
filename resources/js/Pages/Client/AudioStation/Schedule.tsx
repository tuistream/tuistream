import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, Plus, Settings } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationSchedule() {
    const { station } = usePage<any>().props as PageProps;
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <AudioStationLayout currentSection="schedule">
            <Head title={`${station.name} - Calendario`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <Calendar className="w-4 h-4" />
                        </div>
                        Calendario y Programación
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Configure listas y locuciones de DJs en días y horas específicas de la semana</p>
                </div>

                <button
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                    <Plus className="w-4 h-4" /> Programar Evento
                </button>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-sm overflow-hidden p-5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-center">
                    {days.map((day) => (
                        <div key={day} className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                            <h3 className="text-xs font-extrabold text-white">{day}</h3>
                            <div className="space-y-2">
                                {day === 'Sábado' || day === 'Domingo' ? (
                                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-left text-[10px]">
                                        <span className="font-bold text-indigo-400 block">DJs en Vivo</span>
                                        <span className="text-slate-500 font-mono block mt-0.5">18:00 - 22:00</span>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-left text-[10px]">
                                        <span className="font-bold text-slate-400 block">Rotación FM</span>
                                        <span className="text-slate-500 font-mono block mt-0.5">Todo el día</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AudioStationLayout>
    );
}
