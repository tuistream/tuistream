import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { FileText, Terminal, RefreshCw } from 'lucide-react';
import AudioStationLayout from './Layout';

interface StationData {
    id: number;
    name: string;
}

interface PageProps {
    station: StationData;
}

export default function AudioStationLogs() {
    const { station } = usePage<any>().props as PageProps;
    const [logType, setLogType] = useState<'icecast' | 'autodj'>('icecast');

    const icecastLogs = `[2026-05-27  13:50:11] INFO connection/connection_accept accept connection on port 8000
[2026-05-27  13:50:12] INFO source/source_init Source /radio.mp3 at client 127.0.0.1 (Liquidsoap) opening
[2026-05-27  13:50:12] INFO source/source_main source "/radio.mp3" is now active
[2026-05-27  13:51:24] INFO source/source_read client on source "/radio.mp3" (Wendy Gomez) connected
[2026-05-27  13:52:05] INFO stats/stats_update listeners count updated: 1 concurrent listener`;

    const autodjLogs = `2026/05/27 13:50:09 [decoder:3] Audio format: mp3
2026/05/27 13:50:10 [playlist:3] Loaded playlist "Rotación General" (14 tracks)
2026/05/27 13:50:10 [autodj:3] Next track selected: "Antony Santos - Voy Pa'llá" (duration: 254s)
2026/05/27 13:50:12 [output_icecast:3] Connection to tu-server:8000/radio.mp3 succeeded!
2026/05/27 13:50:12 [output_icecast:3] Now streaming: "Antony Santos - Voy Pa'llá"`;

    return (
        <AudioStationLayout currentSection="logs">
            <Head title={`${station.name} - Archivos de Registro`} />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                            <FileText className="w-4 h-4" />
                        </div>
                        Archivos de Registro
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Consulte los logs en vivo del servidor de radio y del motor AutoDJ</p>
                </div>
            </div>

            {/* Selector of logs */}
            <div className="flex border-b border-slate-900 mb-6 bg-slate-950/40 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setLogType('icecast')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        logType === 'icecast' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    Icecast Server Log
                </button>
                <button
                    onClick={() => setLogType('autodj')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        logType === 'autodj' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white'
                    }`}
                >
                    AutoDJ Engine Log
                </button>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 font-mono text-[11px] text-slate-300 leading-relaxed shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <span className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-sans font-bold">
                        <Terminal className="w-4 h-4 text-indigo-400" /> consola del sistema
                    </span>
                    <button className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg transition-all" title="Recargar logs">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="overflow-x-auto max-h-[350px]">
                    <pre className="whitespace-pre">{logType === 'icecast' ? icecastLogs : autodjLogs}</pre>
                </div>
            </div>
        </AudioStationLayout>
    );
}
