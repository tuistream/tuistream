<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
     * Mostrar el dashboard del cliente con TODAS sus estaciones.
     */
    public function index()
    {
        $user = Auth::user();

        // Obtener todas las estaciones del usuario
        $stations = Station::where('user_id', $user->id)->latest()->get();

        $audioStations = $stations->where('type', 'audio')->values();
        $videoStations = $stations->where('type', 'video')->values();

        return Inertia::render('Client/Dashboard', [
            'audioStations' => $audioStations->map(fn($s) => $this->formatStation($s)),
            'videoStations' => $videoStations->map(fn($s) => $this->formatStation($s)),
            'stats' => [
                'total' => $stations->count(),
                'online' => $stations->where('status', 'online')->count(),
                'audio_count' => $audioStations->count(),
                'video_count' => $videoStations->count(),
            ],
        ]);
    }

    /**
     * Formatear la data de una estación para el frontend.
     */
    protected function formatStation(Station $station): array
    {
        $realStats = $this->orchestrator->getRealStats($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $port = request()->getPort();
        $portSuffix = ($port == 80 || $port == 443) ? '' : ":{$port}";
        $scheme = request()->getScheme();

        return [
            'id' => $station->id,
            'name' => $station->name,
            'slug' => $station->slug,
            'port' => $station->port,
            'dj_port' => $station->port + 1000,
            'status' => $station->status,
            'bitrate' => $station->bitrate,
            'max_listeners' => $station->max_listeners,
            'type' => $station->type,
            'frontend' => $station->frontend,
            'stream_key' => $station->stream_key ?? 'live',
            'stream_url' => $station->type === 'video'
                ? "{$scheme}://{$domain}:{$station->port}"
                : "{$scheme}://{$domain}:{$station->port}/radio.mp3",
            'listeners' => $realStats['listeners'],
            'now_playing' => $realStats['now_playing'],
            'service_type' => $station->service_type ?? ($station->type === 'video' ? 'live_streaming' : 'none'),
            'server_domain' => $domain,
            'rtmp_domain' => $domain,
            'dj_password' => $station->admin_password ?? ('dj_' . $station->slug),
            'storage_used_mb' => round($station->mediaFiles()->sum('size') / 1024 / 1024, 2),
            'storage_limit_mb' => $station->storage_limit ?? 1024,
        ];
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
            return back()->with('success', 'Servicios de streaming reiniciados con éxito.');
        }

        return back()->with('error', 'Error al reiniciar la emisora: ' . $result['output']);
    }

    /**
     * Mostrar perfil de datos personales del cliente.
     */
    public function showProfile()
    {
        $user = Auth::user();
        return Inertia::render('Client/Profile', [
            'client' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Actualizar datos personales del cliente.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Sus datos personales han sido actualizados con éxito.');
    }
}
