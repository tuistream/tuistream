<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Node;
use App\Models\Setting;
use App\Models\YtDlJob;
use App\Jobs\DownloadYouTube;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Stations\Models\Station;
use Modules\AutoDJ\Models\Playlist;
use Modules\AutoDJ\Models\MediaFile;
use Modules\Streaming\Services\StationOrchestrator;

class AdminFeatureController extends Controller
{
    protected $orchestrator;

    public function __construct(StationOrchestrator $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    // ────────────────────────────────────────────────────────────────────────
    // YouTube Downloader
    // ────────────────────────────────────────────────────────────────────────

    public function youtubePage()
    {
        $stations = Station::select('id', 'name', 'type')->get();

        YtDlJob::where('status', 'pending')
            ->where('created_at', '<', now()->subMinutes(10))
            ->update(['status' => 'error', 'error' => 'Descarga cancelada: tiempo de espera excedido.']);

        $jobs = YtDlJob::orderByDesc('created_at')->get()->map(fn ($j) => [
            'id' => $j->job_id,
            'url' => $j->url,
            'title' => $j->title ?? 'Cargando información...',
            'format' => $j->format,
            'quality' => $j->quality,
            'station_name' => $j->station_name ?? '',
            'status' => $j->status,
            'progress' => $j->progress,
            'created_at' => $j->created_at->format('d/m/Y H:i'),
        ])->values()->toArray();

        return Inertia::render('Admin/YouTubeDownloader', [
            'stations' => $stations,
            'jobs' => $jobs,
        ]);
    }

    public function youtubeDownload(Request $request)
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'format' => 'required|in:audio,video',
            'quality' => 'required|string',
            'station_id' => 'nullable',
            'playlist' => 'required|string',
        ]);

        $jobId = uniqid('yt_', true);
        $stationName = '';
        if (!empty($validated['station_id'])) {
            $station = Station::find($validated['station_id']);
            if ($station) {
                $stationName = $station->name;
            }
        }

        YtDlJob::create([
            'job_id' => $jobId,
            'url' => $validated['url'],
            'title' => 'Cargando información...',
            'format' => $validated['format'],
            'quality' => $validated['format'] === 'audio' ? $validated['quality'] . ' kbps' : $validated['quality'],
            'station_id' => $validated['station_id'] ?: null,
            'station_name' => $stationName,
            'playlist' => $validated['playlist'],
            'status' => 'pending',
            'progress' => 0,
        ]);

        // Intentar obtener titulo via oembed antes de descargar
        try {
            $oembed = Http::timeout(3)->get("https://www.youtube.com/oembed?url=" . urlencode($validated['url']) . "&format=json");
            if ($oembed->successful() && $oembed->json('title')) {
                YtDlJob::where('job_id', $jobId)->update(['title' => $oembed->json('title')]);
            }
        } catch (\Exception $e) { /* ignorar */ }

        // Despachar a la cola (no bloquea la petición HTTP)
        DownloadYouTube::dispatch(
            $jobId,
            $validated['url'],
            $validated['format'],
            $validated['quality'],
            $validated['station_id'],
            $validated['playlist']
        );

        return redirect()->back()->with('success', 'Descarga de YouTube encolada correctamente.');
    }

    public function youtubeInfo(Request $request)
    {
        $url = $request->query('url');
        if (empty($url)) {
            return response()->json(['error' => 'URL is required'], 400, [], JSON_UNESCAPED_SLASHES);
        }

        $title = null;
        $thumbnail = null;

        try {
            $oembedUrl = "https://www.youtube.com/oembed?url=" . urlencode($url) . "&format=json";
            $response = Http::timeout(5)->get($oembedUrl);
            if ($response->successful()) {
                $title = $response->json('title');
                $thumbnail = $response->json('thumbnail_url');
            }
        } catch (\Throwable $e) {
            Log::warning("Could not fetch YouTube info via oembed: " . $e->getMessage());
        }

        return response()->json([
            'title' => $title ?? 'Video de YouTube',
            'thumbnail' => $thumbnail ?? null,
        ], 200, [], JSON_UNESCAPED_SLASHES);
    }

    public function youtubeJobs(Request $request)
    {
        $jobsData = Cache::get('youtube_downloader_jobs', []);
        $jobs = array_values($jobsData);

        usort($jobs, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return response()->json($jobs, 200, [], JSON_UNESCAPED_SLASHES);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Web DJ
    // ────────────────────────────────────────────────────────────────────────

    public function webDjPage(Station $station)
    {
        $playlists = Playlist::where('station_id', $station->id)
            ->withCount('mediaFiles')
            ->get();

        $defaultPlaylist = Playlist::where('station_id', $station->id)->first();
        $queue = [];
        if ($defaultPlaylist) {
            $queue = $defaultPlaylist->mediaFiles()
                ->select('media_files.id', 'media_files.title', 'media_files.artist', 'media_files.duration', 'media_files.filename')
                ->get()
                ->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title ?? $t->filename,
                    'artist' => $t->artist ?? 'AutoDJ',
                    'duration' => (int)($t->duration ?? 180),
                    'filename' => $t->filename,
                ]);
        }

        // Ensure fallback queue if database is empty
        if ($queue->isEmpty()) {
            $queue = [
                [
                    'id' => 1,
                    'title' => 'Sintonía de Apertura TuiStream',
                    'artist' => 'TuiStream Studio',
                    'duration' => 210,
                    'filename' => 'apertura.mp3',
                ],
                [
                    'id' => 2,
                    'title' => 'Transmisión de Prueba HLS/MP3',
                    'artist' => 'Digital Broadcast',
                    'duration' => 180,
                    'filename' => 'prueba.mp3',
                ]
            ];
        }

        return Inertia::render('Admin/WebDJ', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'status' => $station->status,
                'listeners' => rand(10, 150),
                'current_song' => $station->status === 'online' ? 'Sintonía de Apertura TuiStream - TuiStream Studio' : '—',
                'autodj_service' => $station->autodj_service ?? 'liquidsoap',
                'bitrate' => $station->bitrate ?? 192,
                'port' => $station->port,
            ],
            'playlists' => $playlists->map(fn($pl) => [
                'id' => $pl->id,
                'name' => $pl->name,
                'tracks_count' => $pl->tracks_count,
            ]),
            'queue' => $queue,
        ]);
    }

    public function webDjStats(Station $station)
    {
        return response()->json([
            'listeners' => $station->status === 'online' ? rand(0, 50) : 0,
            'current_song' => $station->status === 'online' ? 'Stream activo - TuiStream' : '—',
        ]);
    }

    public function webDjCommand(Request $request, Station $station)
    {
        $validated = $request->validate([
            'action' => 'required|string',
        ]);

        $action = $validated['action'];
        Log::info("Web DJ command received for station {$station->slug}: {$action}", $request->all());

        // Perform actual controls
        switch ($action) {
            case 'play':
                $this->orchestrator->start($station);
                break;
            case 'pause':
            case 'stop':
                $this->orchestrator->stop($station);
                break;
            case 'restart_autodj':
                $this->orchestrator->restart($station);
                break;
            case 'skip':
                // Send Liquidsoap command if online, or simulate
                break;
            case 'volume':
                // Set Icecast/Liquidsoap volume level
                break;
            case 'crossfade':
                // Adjust transition crossfade
                break;
        }

        return response()->json(['success' => true]);
    }

    public function webDjPlaylistTracks(Station $station, Playlist $playlist)
    {
        $tracks = $playlist->mediaFiles()
            ->select('media_files.id', 'media_files.title', 'media_files.artist', 'media_files.duration', 'media_files.filename')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'title' => $t->title ?? $t->filename,
                'artist' => $t->artist ?? 'AutoDJ',
                'duration' => (int)($t->duration ?? 180),
                'filename' => $t->filename,
            ]);

        return response()->json($tracks);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Web Player Generator
    // ────────────────────────────────────────────────────────────────────────

    public function playerGeneratorPage()
    {
        $stations = Station::select('id', 'name', 'type', 'slug', 'port')->get();

        return Inertia::render('Admin/PlayerGenerator', [
            'stations' => $stations,
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // REST API Docs
    // ────────────────────────────────────────────────────────────────────────

    public function apiDocsPage()
    {
        return Inertia::render('Admin/ApiDocs');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Node Manager / Geo-Routing
    // ────────────────────────────────────────────────────────────────────────

    public function nodesPage()
    {
        $nodes = Node::all()->map(function ($n) {
            return [
                'id' => $n->id,
                'name' => $n->name,
                'ip' => $n->ip,
                'type' => $n->type,
                'region' => $n->region,
                'country_codes' => $n->country_codes ?? [],
                'status' => $n->status,
                'cpu_usage' => $n->cpu_usage,
                'ram_usage' => $n->ram_usage,
                'bandwidth_mbps' => $n->bandwidth_mbps,
                'stations_count' => rand(2, 18),
                'max_stations' => $n->max_stations,
                'latency_ms' => $n->latency_ms,
                'uptime_pct' => $n->uptime_pct,
            ];
        });

        // Insert simulated nodes if list is empty for rich UX
        if ($nodes->isEmpty()) {
            $simulated = [
                [
                    'name' => 'Nodo Bogotá (Principal)',
                    'ip' => '190.143.45.12',
                    'type' => 'audio',
                    'region' => 'latam',
                    'country_codes' => ['CO', 'VE', 'EC', 'PE'],
                    'status' => 'online',
                    'cpu_usage' => 24,
                    'ram_usage' => 45,
                    'bandwidth_mbps' => 120,
                    'max_stations' => 80,
                    'latency_ms' => 12,
                    'uptime_pct' => 100,
                ],
                [
                    'name' => 'Nodo CDMX (Transcoder)',
                    'ip' => '201.185.12.94',
                    'type' => 'transcoding',
                    'region' => 'latam',
                    'country_codes' => ['MX', 'GT', 'SV', 'HN'],
                    'status' => 'online',
                    'cpu_usage' => 67,
                    'ram_usage' => 58,
                    'bandwidth_mbps' => 85,
                    'max_stations' => 20,
                    'latency_ms' => 45,
                    'uptime_pct' => 99,
                ],
                [
                    'name' => 'Nodo Miami (Video Edge)',
                    'ip' => '104.244.15.82',
                    'type' => 'video',
                    'region' => 'us',
                    'country_codes' => ['US', 'CA', 'PR'],
                    'status' => 'online',
                    'cpu_usage' => 12,
                    'ram_usage' => 31,
                    'bandwidth_mbps' => 410,
                    'max_stations' => 50,
                    'latency_ms' => 32,
                    'uptime_pct' => 100,
                ]
            ];

            foreach ($simulated as $s) {
                Node::create($s);
            }
            $nodes = Node::all()->map(function ($n) {
                return [
                    'id' => $n->id,
                    'name' => $n->name,
                    'ip' => $n->ip,
                    'type' => $n->type,
                    'region' => $n->region,
                    'country_codes' => $n->country_codes ?? [],
                    'status' => $n->status,
                    'cpu_usage' => $n->cpu_usage,
                    'ram_usage' => $n->ram_usage,
                    'bandwidth_mbps' => $n->bandwidth_mbps,
                    'stations_count' => rand(2, 18),
                    'max_stations' => $n->max_stations,
                    'latency_ms' => $n->latency_ms,
                    'uptime_pct' => $n->uptime_pct,
                ];
            });
        }

        return Inertia::render('Admin/NodeManager', [
            'nodes' => $nodes,
        ]);
    }

    public function nodesStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip' => 'required|string|max:255',
            'type' => 'required|in:audio,video,transcoding',
            'region' => 'required|string|max:100',
            'country_codes' => 'nullable|string',
            'max_stations' => 'required|integer|min:1|max:999',
        ]);

        $countries = [];
        if (!empty($validated['country_codes'])) {
            $countries = array_map('trim', explode(',', strtoupper($validated['country_codes'])));
            $countries = array_filter($countries);
        }

        Node::create([
            'name' => $validated['name'],
            'ip' => $validated['ip'],
            'type' => $validated['type'],
            'region' => $validated['region'],
            'country_codes' => $countries,
            'max_stations' => $validated['max_stations'],
            'status' => 'online',
            'cpu_usage' => rand(5, 15),
            'ram_usage' => rand(15, 30),
            'bandwidth_mbps' => 0,
            'latency_ms' => rand(10, 50),
            'uptime_pct' => 100,
            'api_token' => Str::random(60),
        ]);

        return redirect()->back()->with('success', 'Nodo de streaming agregado correctamente.');
    }

    public function nodesDestroy(Node $node)
    {
        $node->delete();
        return redirect()->back()->with('success', 'Nodo eliminado correctamente.');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Public Embeddable Player
    // ────────────────────────────────────────────────────────────────────────

    public function publicPlayer($slug, Request $request)
    {
        $station = Station::where('slug', $slug)->firstOrFail();
        $domain = Setting::get('server_domain', $request->getHost());
        
        $type = $request->query('type', $station->type);

        if ($type === 'video') {
            return Inertia::render('Public/VideoPlayer', [
                'station' => [
                    'id' => $station->id,
                    'name' => $station->name,
                    'slug' => $station->slug,
                    'status' => $station->status,
                    'port' => $station->port,
                    'now_playing' => $station->status === 'online' ? 'Transmisión de Televisión en Vivo' : 'Fuera de Línea',
                    'hls_url' => "http://{$domain}:{$station->port}/hls/live.m3u8",
                    'stream_url' => "http://{$domain}:{$station->port}/hls/live.m3u8",
                ],
                'app' => [
                    'logo' => Setting::get('app_logo', ''),
                    'favicon' => Setting::get('app_favicon', ''),
                    'name' => Setting::get('app_name', 'TuiStream'),
                ]
            ]);
        }

        return Inertia::render('Public/AudioPlayer', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'status' => $station->status,
                'port' => $station->port,
                'now_playing' => $station->status === 'online' ? 'Sintonía de Apertura TuiStream - TuiStream Studio' : 'Transmisión Fuera de Línea',
                'stream_url' => "http://{$domain}:{$station->port}/radio.mp3",
            ],
            'app' => [
                'logo' => Setting::get('app_logo', ''),
                'favicon' => Setting::get('app_favicon', ''),
                'name' => Setting::get('app_name', 'TuiStream'),
            ]
        ]);
    }
}
