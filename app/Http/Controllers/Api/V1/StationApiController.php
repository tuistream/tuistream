<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Jobs\DownloadYouTube;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\Stations\Models\Station;
use Modules\AutoDJ\Models\Playlist;
use Modules\AutoDJ\Models\MediaFile;
use Modules\Streaming\Services\StationOrchestrator;

class StationApiController extends Controller
{
    protected $orchestrator;

    public function __construct(StationOrchestrator $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    /**
     * List all stations.
     */
    public function index()
    {
        $stations = Station::with('user')->get()->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'type' => $s->type,
            'port' => $s->port,
            'status' => $s->status,
            'bitrate' => $s->bitrate,
            'max_listeners' => $s->max_listeners,
            'client' => [
                'id' => $s->user->id ?? null,
                'name' => $s->user->name ?? 'N/A',
                'email' => $s->user->email ?? 'N/A',
            ],
            'created_at' => $s->created_at->toIso8601String(),
        ]);

        return response()->json($stations);
    }

    /**
     * Get details of a single station.
     */
    public function show($id)
    {
        $station = Station::with('user')->find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        return response()->json([
            'id' => $station->id,
            'name' => $station->name,
            'slug' => $station->slug,
            'type' => $station->type,
            'port' => $station->port,
            'status' => $station->status,
            'bitrate' => $station->bitrate,
            'max_listeners' => $station->max_listeners,
            'service_type' => $station->service_type,
            'transcoder_profile' => $station->transcoder_profile,
            'stream_targets_limit' => $station->stream_targets_limit,
            'stream_targets' => $station->stream_targets,
            'geoip_locking' => $station->geoip_locking,
            'ndvr_rewind' => $station->ndvr_rewind,
            'client' => [
                'id' => $station->user->id ?? null,
                'name' => $station->user->name ?? 'N/A',
                'email' => $station->user->email ?? 'N/A',
            ],
            'created_at' => $station->created_at->toIso8601String(),
        ]);
    }

    /**
     * Create a new station.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:audio,video',
            'port' => 'required|integer|unique:stations,port',
            'bitrate' => 'required|integer',
            'max_listeners' => 'required|integer',
            // Audio-specific
            'frontend' => 'nullable|string|in:icecast_kh,icecast,shoutcast',
            'autodj_service' => 'nullable|string|in:liquidsoap,none',
            // Video-specific
            'service_type' => 'nullable|string|in:live_streaming,stream_relay,tv_station',
            'transcoder_profile' => 'nullable|string',
        ]);

        $slug = Str::slug($validated['name']) . '-' . Str::random(4);
        
        $adminPassword = Str::random(14);
        $ftpPassword = Str::random(16);
        $streamKey = 'live_' . Str::random(12);

        $station = Station::create([
            'user_id' => $validated['client_id'],
            'name' => $validated['name'],
            'slug' => $slug,
            'type' => $validated['type'],
            'port' => $validated['port'],
            'bitrate' => $validated['bitrate'],
            'max_listeners' => $validated['max_listeners'],
            
            // Audio setup
            'frontend' => $validated['frontend'] ?? ($validated['type'] === 'audio' ? 'icecast_kh' : 'none'),
            'autodj_service' => $validated['autodj_service'] ?? ($validated['type'] === 'audio' ? 'liquidsoap' : 'none'),
            'backend' => $validated['autodj_service'] ?? ($validated['type'] === 'audio' ? 'liquidsoap' : 'none'),
            'admin_password' => $adminPassword,
            
            // Video setup
            'service_type' => $validated['service_type'] ?? 'live_streaming',
            'transcoder_profile' => $validated['transcoder_profile'] ?? ($validated['type'] === 'video' ? '720p' : 'none'),
            'stream_key' => $streamKey,
            'ftp_password' => $ftpPassword,
            
            'status' => 'offline',
            'is_active' => true,
        ]);

        $this->orchestrator->setup($station);
        $this->orchestrator->start($station);

        return response()->json([
            'message' => __('Station created successfully'),
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'port' => $station->port,
            ]
        ], 201);
    }

    /**
     * Update an existing station.
     */
    public function update(Request $request, $id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'bitrate' => 'nullable|integer',
            'max_listeners' => 'nullable|integer',
            'geoip_locking' => 'nullable|boolean',
            'ndvr_rewind' => 'nullable|boolean',
        ]);

        $station->update($validated);
        
        // Re-generate config
        $this->orchestrator->setup($station);

        return response()->json([
            'message' => 'Station updated successfully',
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'type' => $station->type,
                'port' => $station->port,
                'status' => $station->status,
                'bitrate' => $station->bitrate,
                'max_listeners' => $station->max_listeners,
                'geoip_locking' => $station->geoip_locking,
                'ndvr_rewind' => $station->ndvr_rewind,
            ]
        ]);
    }

    /**
     * Delete an existing station.
     */
    public function destroy($id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $this->orchestrator->delete($station);
        $station->delete();

        return response()->json(['message' => 'Station deleted successfully']);
    }

    /**
     * Get live stats of a station.
     */
    public function stats($id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $realStats = $this->orchestrator->getRealStats($station);

        return response()->json([
            'id' => $station->id,
            'name' => $station->name,
            'status' => $station->status,
            'listeners' => $realStats['listeners'],
            'current_song' => $realStats['now_playing'],
        ]);
    }

    /**
     * Start a station.
     */
    public function start($id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $result = $this->orchestrator->start($station);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Station started' : 'Station fail to start',
            'output' => $result['output'],
        ]);
    }

    /**
     * Stop a station.
     */
    public function stop($id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        $result = $this->orchestrator->stop($station);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Station stopped' : 'Station fail to stop',
            'output' => $result['output'],
        ]);
    }

    /**
     * Get stream status.
     */
    public function streamStatus($id)
    {
        $station = Station::find($id);

        if (!$station) {
            return response()->json(['error' => 'Station not found'], 404);
        }

        return response()->json([
            'id' => $station->id,
            'status' => $station->status,
            'is_active' => $station->is_active,
        ]);
    }

    /**
     * List all clients.
     */
    public function clientsIndex()
    {
        $clients = User::whereIn('role', ['client', 'admin'])->get()->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'email' => $c->email,
            'role' => $c->role,
            'status' => $c->status ?? 'active',
            'created_at' => $c->created_at->toIso8601String(),
        ]);

        return response()->json($clients);
    }

    /**
     * Create a new client.
     */
    public function clientsStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $client = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'client',
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Client created successfully',
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
            ]
        ], 201);
    }

    /**
     * Enqueue a YouTube download via API.
     */
    public function youtubeDownload(Request $request)
    {
        $validated = $request->validate([
            'url' => 'required|url',
            'format' => 'required|in:audio,video',
            'quality' => 'required|string',
            'station_id' => 'nullable|exists:stations,id',
        ]);

        $jobId = uniqid('yt_', true);
        $stationName = '';
        if (!empty($validated['station_id'])) {
            $station = Station::find($validated['station_id']);
            if ($station) {
                $stationName = $station->name;
            }
        }

        $jobData = [
            'id' => $jobId,
            'url' => $validated['url'],
            'title' => 'Cargando información via API...',
            'format' => $validated['format'],
            'quality' => $validated['format'] === 'audio' ? $validated['quality'] . ' kbps' : $validated['quality'],
            'station_name' => $stationName,
            'status' => 'pending',
            'progress' => 0,
            'created_at' => now()->format('d/m/Y H:i'),
        ];

        $jobs = Cache::get('youtube_downloader_jobs', []);
        $jobs[$jobId] = $jobData;
        Cache::put('youtube_downloader_jobs', $jobs, 86400);

        DownloadYouTube::dispatch(
            $jobId,
            $validated['url'],
            $validated['format'],
            $validated['quality'],
            $validated['station_id'],
            'default'
        );

        return response()->json([
            'message' => 'YouTube download job enqueued via API',
            'job_id' => $jobId,
        ]);
    }
}
