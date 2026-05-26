<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Modules\Stations\Models\Station;
use Modules\Streaming\Services\StationOrchestrator;

class ClientDashboardController extends Controller
{
    protected $orchestrator;

    public function __construct(StationOrchestrator $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    /**
     * Mostrar el dashboard de la emisora del cliente.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Obtener la primera estación asociada al usuario
        $station = Station::where('user_id', $user->id)->first();

        if (!$station) {
            return Inertia::render('Client/NoStation');
        }

        // Obtener estadísticas de reproducción simuladas
        $listenersCount = $station->status === 'online' ? rand(10, $station->max_listeners - 10) : 0;
        $activeSong = $station->status === 'online' ? 'Stereo Love - Edward Maya feat. Vika Jigulina' : 'Estación apagada';

        return Inertia::render('Client/Dashboard', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'port' => $station->port,
                'dj_port' => $station->port + 1000,
                'status' => $station->status,
                'bitrate' => $station->bitrate,
                'max_listeners' => $station->max_listeners,
                'stream_url' => "http://localhost:{$station->port}/radio.mp3",
            ],
            'now_playing' => [
                'song' => $activeSong,
                'listeners' => $listenersCount,
                'peak_listeners' => $station->status === 'online' ? $station->max_listeners - 5 : 0,
            ]
        ]);
    }

    /**
     * Alternar el encendido/apagado de la emisora.
     */
    public function toggleStatus(Station $station)
    {
        // Seguridad: Verificar pertenencia
        if ($station->user_id !== Auth::id() && Auth::user()->role !== 'super_admin') {
            abort(403);
        }

        if ($station->status === 'online') {
            $result = $this->orchestrator->stop($station);
            $msg = 'Estación apagada.';
        } else {
            $result = $this->orchestrator->start($station);
            $msg = 'Estación encendida y transmitiendo.';
        }

        if ($result['success']) {
            return back()->with('success', $msg);
        }

        return back()->with('error', 'Ocurrió un error al cambiar el estado: ' . $result['output']);
    }

    /**
     * Reiniciar los servicios de la emisora.
     */
    public function restartStation(Station $station)
    {
        if ($station->user_id !== Auth::id() && Auth::user()->role !== 'super_admin') {
            abort(403);
        }

        $result = $this->orchestrator->restart($station);

        if ($result['success']) {
            return back()->with('success', 'Servicios de streaming e hilos de AutoDJ reiniciados con éxito.');
        }

        return back()->with('error', 'Error al reiniciar la emisora: ' . $result['output']);
    }
}
