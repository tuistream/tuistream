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
     * Dashboard general con estadísticas globales.
     */
    public function index()
    {
        $stations = Station::with('user')->latest()->get();
        $clientsCount = User::where('role', 'client')->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_stations' => $stations->count(),
                'audio_stations' => $stations->where('type', 'audio')->count(),
                'video_stations' => $stations->where('type', 'video')->count(),
                'online_stations' => $stations->where('status', 'online')->count(),
                'total_clients' => $clientsCount,
                'total_listeners' => $stations->where('status', 'online')->sum('max_listeners'),
            ],
            'recent_stations' => $stations->take(5)->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'type' => $s->type,
                'status' => $s->status,
                'client_name' => $s->user->name ?? 'N/A',
                'created_at' => $s->created_at->diffForHumans(),
            ]),
            'system_metrics' => $this->getSystemMetrics(),
        ]);
    }

    /**
     * Endpoint JSON para métricas en tiempo real (polling desde el frontend).
     */
    public function systemMetricsJson()
    {
        return response()->json($this->getSystemMetrics());
    }

    /**
     * Endpoint JSON para diagnósticos de servicios (carga asíncrona desde frontend).
     */
    public function diagnosticsJson()
    {
        return response()->json($this->getDiagnostics());
    }

    /**
     * Endpoint JSON para conteo real de oyentes (StationOrchestrator).
     * Agrega todas las estaciones online con timeout mínimo para no bloquear.
     */
    public function realListenersJson()
    {
        $stations = Station::where('status', 'online')->get();
        $total = 0;
        $details = [];

        foreach ($stations as $station) {
            try {
                $stats = $this->orchestrator->getRealStats($station);
                $listeners = $stats['listeners'] ?? 0;
                $total += (int) $listeners;
                $details[] = [
                    'id' => $station->id,
                    'name' => $station->name,
                    'type' => $station->type,
                    'listeners' => (int) $listeners,
                ];
            } catch (\Throwable $e) {
                $details[] = [
                    'id' => $station->id,
                    'name' => $station->name,
                    'listeners' => 0,
                ];
            }
        }

        return response()->json([
            'total' => $total,
            'stations' => $details,
        ]);
    }

    /**
     * Diagnóstico de backend de servicios (Nginx RTMP, Icecast 2 KH, SHOUTcast 2, Liquidsoap).
     * Optimizado con cache y bajísimo timeout (100ms) para impedir demoras en carga.
     */
    public function getDiagnostics(): array
    {
        $isDocker = file_exists('/.dockerenv');

        return cache()->remember('system_diagnostics', 60, function () use ($isDocker) {
            $diagnostics = [];
            
            // 1. Nginx RTMP
            $nginxInstalled = false;
            $nginxVersion = 'No instalado';
            if (PHP_OS_FAMILY === 'Windows') {
                $nginxInstalled = true;
                $nginxVersion = 'Nginx/1.24.0 (Windows Dev Mode)';
            } else {
                $output = [];
                @exec('nginx -v 2>&1', $output, $returnCode);
                if ($returnCode === 0 && !empty($output)) {
                    $nginxInstalled = true;
                    $nginxVersion = implode(' ', $output);
                } elseif (file_exists('/usr/sbin/nginx') || file_exists('/usr/local/nginx/sbin/nginx')) {
                    $nginxInstalled = true;
                    $nginxVersion = 'Nginx (Instalado)';
                } elseif ($isDocker) {
                    // Check docker container on network with ultra-low 100ms timeout
                    $fp = @fsockopen('nginx-rtmp', 80, $errno, $errstr, 0.1);
                    if ($fp) {
                        fclose($fp);
                        $nginxInstalled = true;
                        $nginxVersion = 'Docker tiangolo/nginx-rtmp (Online)';
                    }
                }
            }
            $diagnostics['nginx_rtmp'] = [
                'name' => 'Nginx RTMP',
                'installed' => $nginxInstalled,
                'version' => $nginxVersion,
                'description' => 'Servidor de video de alto rendimiento para HLS y RTMP.'
            ];

            // 2. Icecast 2 KH
            $icecastInstalled = false;
            $icecastVersion = 'No instalado';
            if (PHP_OS_FAMILY === 'Windows') {
                $icecastInstalled = true;
                $icecastVersion = 'Icecast 2.4.4-KH (Windows Dev Mode)';
            } else {
                $output = [];
                @exec('icecast2 -v 2>&1', $output, $returnCode);
                if ($returnCode === 0 && !empty($output)) {
                    $icecastInstalled = true;
                    $icecastVersion = implode(' ', $output);
                } elseif (file_exists('/usr/bin/icecast2') || file_exists('/usr/local/bin/icecast')) {
                    $icecastInstalled = true;
                    $icecastVersion = 'Icecast 2 KH (Instalado)';
                } elseif ($isDocker) {
                    $fp = @fsockopen('icecast', 8000, $errno, $errstr, 0.1);
                    if ($fp) {
                        fclose($fp);
                        $icecastInstalled = true;
                        $icecastVersion = 'Docker libretime/icecast (Online)';
                    }
                } elseif (PHP_OS_FAMILY === 'Windows') {
                    $fp = @fsockopen('127.0.0.1', 8100, $errno, $errstr, 0.1);
                    if ($fp) { fclose($fp); $icecastInstalled = true; $icecastVersion = 'Icecast 2 KH (Windows, puerto 8100)'; }
                }
            }
            $diagnostics['icecast'] = [
                'name' => 'Icecast 2 KH',
                'installed' => $icecastInstalled,
                'version' => $icecastVersion,
                'description' => 'Servidor de transmisión de audio compatible con MP3/AAC.'
            ];

            // 3. SHOUTcast 2
            $shoutcastInstalled = false;
            $shoutcastVersion = 'No instalado';
            if (PHP_OS_FAMILY === 'Windows') {
                $shoutcastInstalled = true;
                $shoutcastVersion = 'SHOUTcast v2.6.1 (Windows Dev Mode)';
            } else {
                $output = [];
                @exec('sc_serv --version 2>&1', $output, $returnCode);
                if ($returnCode === 0 && !empty($output)) {
                    $shoutcastInstalled = true;
                    $shoutcastVersion = implode(' ', $output);
                } elseif (file_exists('/usr/local/bin/sc_serv') || file_exists('/usr/bin/sc_serv')) {
                    $shoutcastInstalled = true;
                    $shoutcastVersion = 'SHOUTcast 2 (Instalado)';
                } elseif ($isDocker) {
                    $fp = @fsockopen('shoutcast', 8000, $errno, $errstr, 0.1);
                    if ($fp) {
                        fclose($fp);
                        $shoutcastInstalled = true;
                        $shoutcastVersion = 'Docker khartool/shoutcast-x64 (Online)';
                    }
                }
            }
            $diagnostics['shoutcast'] = [
                'name' => 'SHOUTcast 2',
                'installed' => $shoutcastInstalled,
                'version' => $shoutcastVersion,
                'description' => 'Servidor de audio propietario de AOL/Nullsoft.'
            ];

            // 4. Liquidsoap
            $liquidsoapInstalled = false;
            $liquidsoapVersion = 'No instalado';
            if (PHP_OS_FAMILY === 'Windows') {
                $liquidsoapInstalled = true;
                $liquidsoapVersion = 'Liquidsoap 2.2.5 (Windows Dev Mode)';
            } else {
                $output = [];
                @exec('liquidsoap --version 2>&1', $output, $returnCode);
                if ($returnCode === 0 && !empty($output)) {
                    $liquidsoapInstalled = true;
                    $liquidsoapVersion = implode(' ', $output);
                } elseif (file_exists('/usr/bin/liquidsoap') || file_exists('/usr/local/bin/liquidsoap')) {
                    $liquidsoapInstalled = true;
                    $liquidsoapVersion = 'Liquidsoap (Instalado)';
                } elseif ($isDocker) {
                    $fp = @fsockopen('liquidsoap', 8015, $errno, $errstr, 0.1);
                    if ($fp) {
                        fclose($fp);
                        $liquidsoapInstalled = true;
                        $liquidsoapVersion = 'Docker savonet/liquidsoap (Online)';
                    }
                }
            }
            $diagnostics['liquidsoap'] = [
                'name' => 'Liquidsoap (AutoDJ)',
                'installed' => $liquidsoapInstalled,
                'version' => $liquidsoapVersion,
                'description' => 'Motor de automatización y generación de flujos de audio.'
            ];

            return $diagnostics;
        });
    }

    /**
     * Obtener métricas reales de hardware (CPU, RAM, Disco) del sistema host / servidor.
     * Funciona en Linux, Windows y Docker. Cacheado por 3 segundos.
     */
    public function getSystemMetrics(): array
    {
        return cache()->remember('system_metrics', 3, function () {
            $cpu = 5.0;
            $totalRam = 16.0;
            $usedRam = 4.12;

            if (PHP_OS_FAMILY === 'Windows') {
                $wmicCpu = @shell_exec('wmic cpu get loadpercentage 2>&1');
                if ($wmicCpu && preg_match('/(\d+)/', $wmicCpu, $m)) {
                    $cpu = (float) $m[1];
                }

                $wmicRam = @shell_exec('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /Value 2>&1');
                if ($wmicRam) {
                    preg_match('/TotalVisibleMemorySize=(\d+)/', $wmicRam, $totalMatch);
                    preg_match('/FreePhysicalMemory=(\d+)/', $wmicRam, $freeMatch);
                    if (isset($totalMatch[1], $freeMatch[1])) {
                        $totalRam = round($totalMatch[1] / 1024 / 1024, 2);
                        $freeRam = round($freeMatch[1] / 1024 / 1024, 2);
                        $usedRam = round($totalRam - $freeRam, 2);
                    }
                }
            } else {
                if (file_exists('/proc/stat')) {
                    $stat1 = file_get_contents('/proc/stat');
                    usleep(10000);
                    $stat2 = file_get_contents('/proc/stat');
                    $info1 = explode(' ', preg_replace('/\s+/', ' ', trim(explode("\n", $stat1)[0])));
                    $info2 = explode(' ', preg_replace('/\s+/', ' ', trim(explode("\n", $stat2)[0])));
                    if (isset($info1[1], $info1[2], $info1[3], $info1[4], $info2[1], $info2[2], $info2[3], $info2[4])) {
                        $total1 = $info1[1] + $info1[2] + $info1[3] + $info1[4];
                        $total2 = $info2[1] + $info2[2] + $info2[3] + $info2[4];
                        $diffTotal = $total2 - $total1;
                        $diffIdle = $info2[4] - $info1[4];
                        if ($diffTotal > 0) {
                            $cpu = round((($diffTotal - $diffIdle) / $diffTotal) * 100, 1);
                        }
                    }
                } elseif (function_exists('sys_getloadavg')) {
                    $load = sys_getloadavg();
                    $cpu = isset($load[0]) ? round($load[0] * 10, 1) : 5.0;
                }

                if (file_exists('/proc/meminfo')) {
                    $meminfo = file_get_contents('/proc/meminfo');
                    preg_match('/MemTotal:\s+(\d+)/', $meminfo, $mt);
                    preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $ma);
                    if (isset($mt[1], $ma[1])) {
                        $totalRam = round($mt[1] / 1024 / 1024, 2);
                        $usedRam = round(($mt[1] - $ma[1]) / 1024 / 1024, 2);
                    }
                }
            }

            try {
                $totalDiskBytes = @disk_total_space('.') ?: (500 * 1024 * 1024 * 1024);
                $freeDiskBytes = @disk_free_space('.') ?: (350 * 1024 * 1024 * 1024);
                $totalDisk = round($totalDiskBytes / 1024 / 1024 / 1024, 1);
                $usedDisk = round(($totalDiskBytes - $freeDiskBytes) / 1024 / 1024 / 1024, 1);
            } catch (\Exception $e) {
                $totalDisk = 500.0;
                $usedDisk = 142.8;
            }

            $onlineStations = Station::where('status', 'online')->get();
            $listeners = 0;
            foreach ($onlineStations as $s) {
                try {
                    $real = $this->orchestrator->getRealStats($s);
                    $listeners += (int) ($real['listeners'] ?? 0);
                } catch (\Throwable $e) {
                    // ignore offline/unreachable station
                }
            }

            return [
                'cpu' => max(1, min(100, $cpu)),
                'ram_used' => max(0.1, $usedRam),
                'ram_total' => max(1, $totalRam),
                'disk_used' => max(0.1, $usedDisk),
                'disk_total' => max(1, $totalDisk),
                'listeners' => $listeners,
            ];
        });
    }

    /**
     * Listado de estaciones de Audio Streaming.
     */
    public function audioIndex()
    {
        $stations = Station::with('user')
            ->where('type', 'audio')
            ->latest()
            ->get();

        $nextPort = max(Station::max('port') ?: 0, 2015) + 5;

        return Inertia::render('Admin/AudioStations', [
            'stations' => $stations->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'port' => $s->port,
                'status' => $s->status,
                'bitrate' => $s->bitrate,
                'max_listeners' => $s->max_listeners,
                'frontend' => $s->frontend,
                'client_name' => $s->user->name ?? 'N/A',
                'client_email' => $s->user->email ?? 'N/A',
                'created_at' => $s->created_at->format('d/m/Y'),
            ]),
            'next_port' => $nextPort,
        ]);
    }

    /**
     * Listado de estaciones de Video Streaming.
     */
    public function videoIndex()
    {
        $stations = Station::with('user')
            ->where('type', 'video')
            ->latest()
            ->get();

        $nextPort = max(Station::max('port') ?: 0, 2015) + 5;

        return Inertia::render('Admin/VideoStations', [
            'stations' => $stations->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'slug' => $s->slug,
                'port' => $s->port,
                'status' => $s->status,
                'stream_key' => $s->stream_key ?? 'live',
                'max_listeners' => $s->max_listeners,
                'client_name' => $s->user->name ?? 'N/A',
                'client_email' => $s->user->email ?? 'N/A',
                'created_at' => $s->created_at->format('d/m/Y'),
            ]),
            'next_port' => $nextPort,
        ]);
    }

    /**
     * Listado de clientes.
     */
    public function clientsIndex()
    {
        $clients = User::whereIn('role', ['client', 'admin'])->with('stations')->withCount('stations')->latest()->get();

        return Inertia::render('Admin/Clients', [
            'clients' => $clients->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'username' => $c->username,
                'email' => $c->email,
                'phone' => $c->phone,
                'status' => $c->status ?? 'active',
                'api_access' => $c->api_access ?? 'disabled',
                'role' => $c->role,
                'stations_count' => $c->stations_count,
                'created_at' => $c->created_at->format('d/m/Y'),
                'stations' => $c->stations->map(fn($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'type' => $s->type,
                    'status' => $s->status,
                    'port' => $s->port,
                    'slug' => $s->slug,
                    'frontend' => $s->frontend,
                    'stream_key' => $s->stream_key,
                ]),
            ]),
        ]);
    }

    /**
     * Mostrar formulario para crear cliente.
     */
    public function createClientForm()
    {
        return Inertia::render('Admin/ClientCreate');
    }

    /**
     * Guardar nuevo cliente.
     */
    public function storeClient(Request $request)
    {
        $validated = $request->validate([
            'username'           => ['nullable', 'string', 'max:100', 'unique:users,username'],
            'name'               => ['required', 'string', 'max:255'],
            'phone'              => ['nullable', 'string', 'max:30'],
            'email'              => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'           => ['required', 'string', 'min:8'],
            'status'             => ['required', 'in:active,disabled'],
            'api_access'         => ['required', 'in:active,disabled'],
            'send_welcome_email' => ['boolean'],
            'role'               => ['required', 'in:client,admin'],
        ]);

        User::create([
            'username'           => $validated['username'] ?? null,
            'name'               => $validated['name'],
            'phone'              => $validated['phone'] ?? null,
            'email'              => $validated['email'],
            'password'           => Hash::make($validated['password']),
            'role'               => $validated['role'],
            'status'             => $validated['status'],
            'api_access'         => $validated['api_access'],
            'send_welcome_email' => $validated['send_welcome_email'] ?? false,
        ]);

        return redirect()->route('admin.clients')->with('success', 'Cliente creado correctamente.');
    }

    /**
     * Mostrar ficha de un cliente.
     */
    public function showClient(User $user)
    {
        if (!in_array($user->role, ['client', 'admin'])) {
            abort(404);
        }

        $user->load('stations');
        $user->stations_count = $user->stations()->count();

        return Inertia::render('Admin/ClientShow', [
            'client' => [
                'id'             => $user->id,
                'name'           => $user->name,
                'username'       => $user->username,
                'email'          => $user->email,
                'phone'          => $user->phone,
                'role'           => $user->role,
                'status'         => $user->status ?? 'active',
                'api_access'     => $user->api_access ?? 'disabled',
                'stations_count' => $user->stations_count,
                'created_at'     => $user->created_at->format('d/m/Y'),
                'stations'       => $user->stations->map(fn($s) => [
                    'id'         => $s->id,
                    'name'       => $s->name,
                    'type'       => $s->type,
                    'status'     => $s->status,
                    'port'       => $s->port,
                    'slug'       => $s->slug,
                    'frontend'   => $s->frontend,
                    'stream_key' => $s->stream_key ?? 'live',
                ]),
            ],
        ]);
    }

    /**
     * Formulario para editar un cliente.
     */
    public function editClientForm(User $user)
    {
        if (!in_array($user->role, ['client', 'admin'])) {
            abort(404);
        }

        return Inertia::render('Admin/ClientEdit', [
            'client' => [
                'id'         => $user->id,
                'username'   => $user->username ?? '',
                'name'       => $user->name,
                'phone'      => $user->phone ?? '',
                'email'      => $user->email,
                'role'       => $user->role,
                'status'     => $user->status ?? 'active',
                'api_access' => $user->api_access ?? 'disabled',
            ],
        ]);
    }

    /**
     * Actualizar datos de un cliente.
     */
    public function updateClient(Request $request, User $user)
    {
        if (!in_array($user->role, ['client', 'admin'])) {
            abort(404);
        }

        $validated = $request->validate([
            'username'   => ['nullable', 'string', 'max:100', 'unique:users,username,' . $user->id],
            'name'       => ['required', 'string', 'max:255'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password'   => ['nullable', 'string', 'min:8'],
            'status'     => ['required', 'in:active,disabled'],
            'api_access' => ['required', 'in:active,disabled'],
            'role'       => ['required', 'in:client,admin'],
        ]);

        $user->username   = $validated['username'] ?? null;
        $user->name       = $validated['name'];
        $user->phone      = $validated['phone'] ?? null;
        $user->email      = $validated['email'];
        $user->status     = $validated['status'];
        $user->api_access = $validated['api_access'];
        $user->role       = $validated['role'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('admin.clients.show', $user->id)->with('success', 'Cliente actualizado correctamente.');
    }

    /**
     * Eliminar un cliente y todos sus servicios asociados.
     */
    public function deleteClient(User $user)
    {
        if ($user->role !== 'client') {
            abort(404);
        }

        // Eliminar todas las estaciones asociadas
        foreach ($user->stations as $station) {
            $this->orchestrator->delete($station);
            $station->delete();
        }

        $name = $user->name;
        $user->delete();

        return redirect()->route('admin.clients')->with('success', "Cliente '{$name}' y sus estaciones asociadas eliminados.");
    }

    /**
     * Crear una estación de Audio Streaming.
     */
    public function createAudioStation(Request $request)
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'station_name' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'unique:stations,port'],
            'bitrate' => ['required', 'integer', 'in:64,128,192,320'],
            'max_listeners' => ['required', 'integer', 'min:10', 'max:5000'],
            'frontend' => ['required', 'string', 'in:icecast,shoutcast'],
        ]);

        $client = User::firstOrCreate(
            ['email' => $validated['client_email']],
            [
                'name' => $validated['client_name'],
                'password' => Hash::make(Str::random(12)),
                'role' => 'client',
            ]
        );

        $station = Station::create([
            'user_id' => $client->id,
            'name' => $validated['station_name'],
            'slug' => Str::slug($validated['station_name']) . '-' . Str::random(4),
            'port' => $validated['port'],
            'bitrate' => $validated['bitrate'],
            'max_listeners' => $validated['max_listeners'],
            'type' => 'audio',
            'frontend' => $validated['frontend'],
            'backend' => 'liquidsoap',
            'status' => 'offline',
            'is_active' => true,
        ]);

        $this->orchestrator->setup($station);
        $startResult = $this->orchestrator->start($station);

        if ($startResult['success']) {
            return back()->with('success', "¡Radio '{$station->name}' creada con éxito! Frontend: {$station->frontend}");
        }

        return back()->with('warning', "La radio se creó en la base de datos, pero el arranque Docker se simuló: " . $startResult['output']);
    }

    /**
     * Formulario dedicado para crear estación de audio (página completa).
     */
    public function createAudioStationForm()
    {
        $clients = User::whereIn('role', ['client', 'admin'])->orderBy('name')->get();
        $nextPort = max(Station::max('port') ?: 0, 8000) + 10;

        return Inertia::render('Admin/AudioStationCreate', [
            'clients' => $clients->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
            ]),
            'next_port' => $nextPort,
        ]);
    }

    /**
     * Guardar nueva estación de audio desde el formulario completo.
     */
    public function createAudioStationFull(Request $request)
    {
        $validated = $request->validate([
            'client_id'          => ['required', 'exists:users,id'],
            'station_name'       => ['required', 'string', 'max:255'],
            'publish_name'       => ['nullable', 'string', 'max:255'],
            'frontend'           => ['required', 'string', 'in:icecast_kh,icecast,shoutcast'],
            'port'               => ['required', 'integer', 'unique:stations,port'],
            'admin_password'     => ['nullable', 'string', 'max:255'],
            'mountpoints'        => ['required', 'integer', 'min:1', 'max:100'],
            'autodj_sources'     => ['required', 'integer', 'min:0', 'max:100'],
            'bitrate'            => ['required', 'integer', 'in:64,96,128,192,256,320'],
            'max_listeners'      => ['required', 'integer', 'min:10', 'max:10000'],
            'disk_space_limit'   => ['required', 'integer', 'min:-1'],
            'data_transfer_limit'=> ['required', 'integer', 'min:-1'],
            'autodj_service'     => ['required', 'string', 'in:liquidsoap,none'],
            'autodj_enabled'     => ['sometimes', 'boolean'],
        ]);

        $adminPassword = !empty($validated['admin_password'])
            ? $validated['admin_password']
            : Str::random(14);

        $publishName = !empty($validated['publish_name'])
            ? $validated['publish_name']
            : '/stream';

        $station = Station::create([
            'user_id'             => $validated['client_id'],
            'name'                => $validated['station_name'],
            'publish_name'        => $publishName,
            'slug'                => Str::slug($validated['station_name']) . '-' . Str::random(4),
            'type'                => 'audio',
            'frontend'            => $validated['frontend'],
            'backend'             => $validated['autodj_service'],
            'autodj_service'      => $validated['autodj_service'],
            'port'                => $validated['port'],
            'admin_password'      => $adminPassword,
            'mountpoints'         => $validated['mountpoints'],
            'autodj_sources'      => $validated['autodj_sources'],
            'bitrate'             => $validated['bitrate'],
            'max_listeners'       => $validated['max_listeners'],
            'disk_space_limit'    => $validated['disk_space_limit'],
            'data_transfer_limit' => $validated['data_transfer_limit'],
            'status'              => 'offline',
            'is_active'           => true,
            'autodj_enabled'      => $request->boolean('autodj_enabled', true),
        ]);

        $this->orchestrator->setup($station);
        $this->orchestrator->start($station);

        return redirect()->route('admin.audio')->with('success', "¡Radio '{$station->name}' creada con éxito! Admin Password: {$adminPassword}");
    }

    /**
     * Formulario dedicado para editar estación de audio.
     */
    public function editAudioStationForm(Station $station)
    {
        if ($station->type !== 'audio') {
            abort(404);
        }

        $station->load('user');

        return Inertia::render('Admin/AudioStationEdit', [
            'station' => [
                'id'                  => $station->id,
                'name'                => $station->name,
                'publish_name'        => $station->publish_name ?? '',
                'frontend'            => $station->frontend ?? 'icecast_kh',
                'port'                => $station->port,
                'admin_password'      => $station->admin_password ?? '',
                'mountpoints'         => $station->mountpoints ?? 1,
                'autodj_sources'      => $station->autodj_sources ?? 1,
                'bitrate'             => $station->bitrate ?? 128,
                'max_listeners'       => $station->max_listeners ?? 100,
                'disk_space_limit'    => $station->disk_space_limit ?? -1,
                'data_transfer_limit' => $station->data_transfer_limit ?? -1,
                'autodj_service'      => $station->autodj_service ?? 'liquidsoap',
                'client_name'         => $station->user->name ?? 'N/A',
                'client_email'        => $station->user->email ?? '',
            ],
        ]);
    }

    /**
     * Actualizar estación de audio desde el formulario completo.
     */
    public function updateAudioStationFull(Request $request, Station $station)
    {
        if ($station->type !== 'audio') {
            abort(404);
        }

        $validated = $request->validate([
            'station_name'       => ['required', 'string', 'max:255'],
            'publish_name'       => ['nullable', 'string', 'max:255'],
            'frontend'           => ['required', 'string', 'in:icecast_kh,icecast,shoutcast'],
            'port'               => ['required', 'integer', 'unique:stations,port,' . $station->id],
            'admin_password'     => ['nullable', 'string', 'max:255'],
            'mountpoints'        => ['required', 'integer', 'min:1', 'max:100'],
            'autodj_sources'     => ['required', 'integer', 'min:0', 'max:100'],
            'bitrate'            => ['required', 'integer', 'min:256', 'max:99999'],
            'max_listeners'      => ['required', 'integer', 'min:10', 'max:10000'],
            'disk_space_limit'   => ['required', 'integer', 'min:-1'],
            'data_transfer_limit'=> ['required', 'integer', 'min:-1'],
            'autodj_service'     => ['required', 'string', 'in:liquidsoap,none'],
        ]);

        $station->update([
            'name'                => $validated['station_name'],
            'publish_name'        => $validated['publish_name'] ?? $station->publish_name,
            'frontend'            => $validated['frontend'],
            'backend'             => $validated['autodj_service'],
            'autodj_service'      => $validated['autodj_service'],
            'port'                => $validated['port'],
            'admin_password'      => !empty($validated['admin_password']) ? $validated['admin_password'] : $station->admin_password,
            'mountpoints'         => $validated['mountpoints'],
            'autodj_sources'      => $validated['autodj_sources'],
            'bitrate'             => $validated['bitrate'],
            'max_listeners'       => $validated['max_listeners'],
            'disk_space_limit'    => $validated['disk_space_limit'],
            'data_transfer_limit' => $validated['data_transfer_limit'],
        ]);

        return redirect()->route('admin.audio')->with('success', "Radio '{$station->name}' actualizada correctamente.");
    }

    /**
     * Crear una estación de Video Streaming.
     */
    public function createVideoStation(Request $request)
    {
        $validated = $request->validate([
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'station_name' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'unique:stations,port'],
            'max_listeners' => ['required', 'integer', 'min:10', 'max:5000'],
            'stream_key' => ['nullable', 'string', 'max:255'],
        ]);

        $client = User::firstOrCreate(
            ['email' => $validated['client_email']],
            [
                'name' => $validated['client_name'],
                'password' => Hash::make(Str::random(12)),
                'role' => 'client',
            ]
        );

        $streamKey = !empty($validated['stream_key']) ? $validated['stream_key'] : 'live_' . Str::random(8);

        $station = Station::create([
            'user_id' => $client->id,
            'name' => $validated['station_name'],
            'slug' => Str::slug($validated['station_name']) . '-' . Str::random(4),
            'port' => $validated['port'],
            'bitrate' => 0,
            'max_listeners' => $validated['max_listeners'],
            'type' => 'video',
            'frontend' => 'none',
            'backend' => 'none',
            'stream_key' => $streamKey,
            'status' => 'offline',
            'is_active' => true,
        ]);

        $this->orchestrator->setup($station);
        $startResult = $this->orchestrator->start($station);

        if ($startResult['success']) {
            return back()->with('success', "¡Canal de video '{$station->name}' creado con éxito! Stream Key: {$streamKey}");
        }

        return back()->with('warning', "El canal se creó en la base de datos, pero el arranque Docker se simuló: " . $startResult['output']);
    }

    /**
     * Formulario dedicado para crear canal de video (página completa).
     */
    public function createVideoStationForm()
    {
        $clients = User::whereIn('role', ['client', 'admin'])->orderBy('name')->get();
        $nextPort = max(Station::max('port') ?: 0, 19000) + 10;

        return Inertia::render('Admin/VideoStationCreate', [
            'clients' => $clients->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
            ]),
            'next_port' => $nextPort,
        ]);
    }

    /**
     * Guardar nuevo canal de video desde el formulario completo.
     */
    public function createVideoStationFull(Request $request)
    {
        $validated = $request->validate([
            'client_id'            => ['required', 'exists:users,id'],
            'station_name'         => ['required', 'string', 'max:255'],
            'service_type'         => ['required', 'in:live_streaming,stream_relay,tv_station'],
            'port'                 => ['required', 'integer', 'unique:stations,port'],
            'stream_key'           => ['nullable', 'string', 'max:255'],
            'ftp_password'         => ['nullable', 'string', 'max:255'],
            'bitrate'              => ['required', 'integer', 'min:256', 'max:99999'],
            'max_listeners'        => ['required', 'integer', 'min:10', 'max:10000'],
            'disk_space_limit'     => ['required', 'integer', 'min:-1'],
            'data_transfer_limit'  => ['required', 'integer', 'min:-1'],
            'transcoder_profiles'   => ['nullable', 'array'],
            'transcoder_profiles.*' => 'string|max:20',
            'stream_targets_limit' => ['required', 'integer', 'min:-1', 'max:50'],
            'selected_platforms'   => ['nullable', 'array'],
            'geoip_locking'        => ['boolean'],
            'ndvr_rewind'          => ['boolean'],
        ]);

        $streamKey = !empty($validated['stream_key'])
            ? $validated['stream_key']
            : 'live_' . Str::random(12);

        $ftpPassword = !empty($validated['ftp_password'])
            ? $validated['ftp_password']
            : Str::random(16);

        $station = Station::create([
            'user_id'              => $validated['client_id'],
            'name'                 => $validated['station_name'],
            'slug'                 => Str::slug($validated['station_name']) . '-' . Str::random(4),
            'type'                 => 'video',
            'service_type'         => $validated['service_type'],
            'frontend'             => 'none',
            'backend'              => 'none',
            'port'                 => $validated['port'],
            'stream_key'           => $streamKey,
            'ftp_password'         => $ftpPassword,
            'bitrate'              => $validated['bitrate'],
            'max_listeners'        => $validated['max_listeners'],
            'disk_space_limit'     => $validated['disk_space_limit'],
            'data_transfer_limit'  => $validated['data_transfer_limit'],
            'transcoder_profiles'   => $validated['transcoder_profiles'] ?? ['source'],
            'stream_targets_limit' => $validated['stream_targets_limit'],
            'stream_targets'       => $validated['selected_platforms'] ?? [],
            'geoip_locking'        => $validated['geoip_locking'] ?? false,
            'ndvr_rewind'          => $validated['ndvr_rewind'] ?? false,
            'status'               => 'offline',
            'is_active'            => true,
        ]);

        $this->orchestrator->setup($station);
        $this->orchestrator->start($station);

        return redirect()->route('admin.video')->with('success', "¡Canal '{$station->name}' creado con éxito! Stream Key: {$streamKey}");
    }

    /**
     * Formulario dedicado para editar canal de video.
     */
    public function editVideoStationForm(Station $station)
    {
        if ($station->type !== 'video') {
            abort(404);
        }

        $station->load('user');

        return Inertia::render('Admin/VideoStationEdit', [
            'station' => [
                'id'                   => $station->id,
                'name'                 => $station->name,
                'port'                 => $station->port,
                'service_type'         => $station->service_type ?? 'live_streaming',
                'stream_key'           => $station->stream_key ?? '',
                'ftp_password'         => $station->ftp_password ?? '',
                'bitrate'              => $station->bitrate ?? 4000,
                'max_listeners'        => $station->max_listeners ?? 100,
                'disk_space_limit'     => $station->disk_space_limit ?? -1,
                'data_transfer_limit'  => $station->data_transfer_limit ?? -1,
                'transcoder_profiles'   => $station->transcoder_profiles ?? ['source'],
                'stream_targets_limit' => $station->stream_targets_limit ?? -1,
                'selected_platforms'   => $station->stream_targets ?? [],
                'geoip_locking'        => (bool) $station->geoip_locking,
                'ndvr_rewind'          => (bool) $station->ndvr_rewind,
                'client_name'          => $station->user->name ?? 'N/A',
                'client_email'         => $station->user->email ?? '',
            ],
        ]);
    }

    /**
     * Actualizar canal de video desde el formulario completo.
     */
    public function updateVideoStationFull(Request $request, Station $station)
    {
        if ($station->type !== 'video') {
            abort(404);
        }

        $validated = $request->validate([
            'station_name'         => ['required', 'string', 'max:255'],
            'service_type'         => ['required', 'in:live_streaming,stream_relay,tv_station'],
            'port'                 => ['required', 'integer', 'unique:stations,port,' . $station->id],
            'stream_key'           => ['nullable', 'string', 'max:255'],
            'ftp_password'         => ['nullable', 'string', 'max:255'],
            'bitrate'              => ['required', 'integer', 'min:256', 'max:99999'],
            'max_listeners'        => ['required', 'integer', 'min:10', 'max:10000'],
            'disk_space_limit'     => ['required', 'integer', 'min:-1'],
            'data_transfer_limit'  => ['required', 'integer', 'min:-1'],
            'transcoder_profiles'   => ['nullable', 'array'],
            'transcoder_profiles.*' => 'string|max:20',
            'stream_targets_limit' => ['required', 'integer', 'min:-1', 'max:50'],
            'selected_platforms'   => ['nullable', 'array'],
            'geoip_locking'        => ['boolean'],
            'ndvr_rewind'          => ['boolean'],
        ]);

        $station->update([
            'name'                 => $validated['station_name'],
            'service_type'         => $validated['service_type'],
            'port'                 => $validated['port'],
            'stream_key'           => $validated['stream_key'] ?? $station->stream_key,
            'ftp_password'         => $validated['ftp_password'] ?? $station->ftp_password,
            'bitrate'              => $validated['bitrate'],
            'max_listeners'        => $validated['max_listeners'],
            'disk_space_limit'     => $validated['disk_space_limit'],
            'data_transfer_limit'  => $validated['data_transfer_limit'],
            'transcoder_profiles'   => $validated['transcoder_profiles'] ?? ['source'],
            'stream_targets_limit' => $validated['stream_targets_limit'],
            'stream_targets'       => $validated['selected_platforms'] ?? [],
            'geoip_locking'        => $validated['geoip_locking'] ?? false,
            'ndvr_rewind'          => $validated['ndvr_rewind'] ?? false,
        ]);

        return redirect()->route('admin.video')->with('success', "Canal '{$station->name}' actualizado correctamente.");
    }

    /**
     * Actualizar una estación existente.
     */
    public function updateStation(Request $request, Station $station)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'port' => ['sometimes', 'integer', 'unique:stations,port,' . $station->id],
            'bitrate' => ['sometimes', 'integer'],
            'max_listeners' => ['sometimes', 'integer', 'min:10', 'max:5000'],
            'frontend' => ['sometimes', 'string', 'in:icecast,shoutcast,none'],
            'stream_key' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $station->update($validated);

        return back()->with('success', "Estación '{$station->name}' actualizada correctamente.");
    }

    /**
     * Detener y eliminar por completo una estación y sus contenedores.
     */
    public function deleteStation(Station $station)
    {
        $name = $station->name;
        $this->orchestrator->delete($station);
        $station->delete();

        return back()->with('success', "La emisora '{$name}' y sus contenedores asociados han sido eliminados.");
    }
}

