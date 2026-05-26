<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Modules\Stations\Models\Station;
use Modules\Streaming\Services\StationOrchestrator;

class AdminDashboardController extends Controller
{
    protected $orchestrator;

    public function __construct(StationOrchestrator $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    /**
     * Mostrar el dashboard global de administración.
     */
    public function index()
    {
        $stations = Station::with('user')->latest()->get();
        $clientsCount = User::where('role', 'client')->count();
        $totalListeners = $stations->where('status', 'online')->sum('max_listeners');

        return Inertia::render('Admin/Dashboard', [
            'stations' => $stations->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'port' => $s->port,
                'status' => $s->status,
                'bitrate' => $s->bitrate,
                'type' => $s->type,
                'frontend' => $s->frontend,
                'client_name' => $s->user->name,
                'client_email' => $s->user->email,
            ]),
            'stats' => [
                'total_stations' => $stations->count(),
                'online_stations' => $stations->where('status', 'online')->count(),
                'total_clients' => $clientsCount,
                'system_cpu' => 14.5,
                'system_ram' => 42.1,
            ]
        ]);
    }

    /**
     * Procesar la creación e instalación (provisioning) de una nueva estación.
     */
    public function createStation(Request $request)
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'station_name' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'unique:stations,port'],
            'bitrate' => ['required', 'integer', 'in:64,128,192,320'],
            'max_listeners' => ['required', 'integer', 'min:10', 'max:5000'],
            'type' => ['required', 'string', 'in:audio,video'],
            'frontend' => ['required', 'string', 'in:icecast,shoutcast,none'],
        ]);

        // 1. Crear o buscar el usuario cliente
        $client = User::firstOrCreate(
            ['email' => $validated['client_email']],
            [
                'name' => $validated['client_name'],
                'password' => Hash::make(Str::random(12)),
                'role' => 'client'
            ]
        );

        // 2. Registrar la estación
        $station = Station::create([
            'user_id' => $client->id,
            'name' => $validated['station_name'],
            'slug' => Str::slug($validated['station_name']),
            'port' => $validated['port'],
            'bitrate' => $validated['bitrate'],
            'max_listeners' => $validated['max_listeners'],
            'type' => $validated['type'],
            'frontend' => $validated['frontend'],
            'status' => 'offline',
            'is_active' => true,
        ]);

        // 3. Aprovisionar y arrancar (Docker / Liquidsoap / Nginx-RTMP)
        $this->orchestrator->setup($station);
        $startResult = $this->orchestrator->start($station);

        if ($startResult['success']) {
            return back()->with('success', "¡Emisora '{$station->name}' ({$station->type}) aprovisionada con éxito!");
        }

        return back()->with('error', "La emisora se creó, pero hubo un problema al levantar su contenedor Docker: " . $startResult['output']);
    }

    /**
     * Detener y eliminar por completo una estación y sus contenedores.
     */
    public function deleteStation(Station $station)
    {
        $this->orchestrator->delete($station);
        $station->delete();

        return back()->with('success', 'La emisora y sus contenedores Docker asociados han sido eliminados.');
    }
}
