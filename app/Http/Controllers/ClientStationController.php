<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Modules\Stations\Models\Station;
use Modules\AutoDJ\Models\MediaFile;
use Modules\Streaming\Services\StationOrchestrator;

class ClientStationController extends Controller
{
    protected $orchestrator;

    public function __construct(StationOrchestrator $orchestrator)
    {
        $this->orchestrator = $orchestrator;
    }

    protected function ensureOwnership(Station $station): void
    {
        if ($station->user_id !== Auth::id() && Auth::user()->role !== 'super_admin') {
            abort(403);
        }
    }

    private function getCommonStationData(Station $station): array
    {
        $realStats = $this->orchestrator->getRealStats($station);

        $usedStorage = $station->mediaFiles()->sum('size');
        $maxStorage = $station->storage_limit ?? 1024;
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());

        $nowPlaying = $realStats['now_playing'];
        $artist = '';
        $title = $nowPlaying;
        if (str_contains($nowPlaying, ' - ')) {
            [$artist, $title] = explode(' - ', $nowPlaying, 2);
        }

        $recentlyPlayed = $this->getRecentlyPlayed($station);

        return [
            'id' => $station->id,
            'name' => $station->name,
            'slug' => $station->slug,
            'type' => $station->type,
            'status' => $station->status,
            'port' => $station->port,
            'dj_port' => $station->port + 1000,
            'bitrate' => $station->bitrate,
            'max_listeners' => $station->max_listeners,
            'frontend' => $station->frontend,
            'stream_key' => $station->stream_key ?? 'live',
            'stream_url' => $station->type === 'video'
                ? "http://{$domain}:{$station->port}"
                : "http://{$domain}:{$station->port}/radio.mp3",
            'hls_url' => $station->type === 'video'
                ? "http://{$domain}:{$station->port}/hls/live.m3u8"
                : null,
            'listeners' => $realStats['listeners'],
            'now_playing' => $nowPlaying,
            'artist' => $artist,
            'title' => $title,
            'server_domain' => $domain,
            'recently_played' => $recentlyPlayed,
            'storage_used_mb' => round($usedStorage / 1024 / 1024, 2),
            'storage_limit_mb' => $maxStorage,
            'bandwidth_used_gb' => round($usedStorage / 1024 / 1024 / 1024, 3),
            'bandwidth_limit_gb' => $station->bandwidth_limit ?? 150,
            'is_active' => $station->is_active,
            'custom_domain' => $station->custom_domain,
            'server_node' => $station->server_node,
            'service_type' => $station->service_type ?? ($station->type === 'video' ? 'live_streaming' : 'none'),
            'stream_targets' => $station->stream_targets ?? [],
        ];
    }

    private function getRecentlyPlayed(Station $station): array
    {
        $key = "station_{$station->id}_recently_played";
        $tracks = \Illuminate\Support\Facades\Cache::get($key, []);
        return is_array($tracks) ? array_slice($tracks, 0, 10) : [];
    }

    /* =========================================================================
       STREAMING AUDIO (RADIO) METHODS
       ========================================================================= */

    public function showAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/General', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function configAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Config', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function mediaAudio(Station $station)
    {
        $this->ensureOwnership($station);
        $files = $station->mediaFiles()->latest()->get()->map(fn($f) => [
            'id' => $f->id,
            'filename' => $f->filename,
            'title' => $f->title,
            'artist' => $f->artist,
            'duration' => $f->duration,
            'size' => $f->size,
            'size_formatted' => $this->formatBytes($f->size),
            'created_at' => $f->created_at->format('d/m/Y H:i'),
        ]);

        $usedStorage = $station->mediaFiles()->sum('size');
        $maxStorage = ($station->storage_limit ?? 1024) * 1024 * 1024;

        return Inertia::render('Client/AudioStation/Media', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'type' => $station->type,
            ],
            'files' => $files,
            'storage' => [
                'used' => $usedStorage,
                'used_formatted' => $this->formatBytes($usedStorage),
                'limit' => $maxStorage,
                'limit_formatted' => $this->formatBytes($maxStorage),
                'percent' => $maxStorage > 0 ? round(($usedStorage / $maxStorage) * 100, 1) : 0,
            ],
        ]);
    }

    public function playlistsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Playlists', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function jinglesAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Jingles', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function scheduleAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Schedule', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function widgetsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $port = request()->getPort();
        $scheme = request()->getScheme();
        $portSuffix = ($port == 80 || $port == 443) ? '' : ":{$port}";
        
        return Inertia::render('Client/AudioStation/Widgets', [
            'station' => $this->getCommonStationData($station),
            'urls' => [
                'public_page' => "{$scheme}://{$domain}{$portSuffix}/public/station/{$station->slug}",
                'admin_url' => "http://{$domain}:{$station->port}/admin",
                'stream_http' => "http://{$domain}:{$station->port}/radio.mp3",
                'stream_https' => "https://{$domain}:{$station->port}/radio.mp3",
            ],
        ]);
    }

    public function publicAudio(Station $station)
    {
        $this->ensureOwnership($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $port = request()->getPort();
        $scheme = request()->getScheme();
        $portSuffix = ($port == 80 || $port == 443) ? '' : ":{$port}";
        
        return Inertia::render('Client/AudioStation/PublicPage', [
            'station' => $this->getCommonStationData($station),
            'url' => "{$scheme}://{$domain}{$portSuffix}/public/station/{$station->slug}",
        ]);
    }

    public function mountPointsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/MountPoints', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function djsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/DJManager', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function songTitleAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/SongTitle', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function logsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Logs', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function reportsAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Reports', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function suspendAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Suspend', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function deleteAudio(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/AudioStation/Delete', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    /* =========================================================================
       STREAMING VIDEO (CANAL TV) METHODS
       ========================================================================= */

    public function showVideo(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/VideoStation/General', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function configVideo(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/VideoStation/Config', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function widgetsVideo(Station $station)
    {
        $this->ensureOwnership($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $port = request()->getPort();
        $scheme = request()->getScheme();
        $portSuffix = ($port == 80 || $port == 443) ? '' : ":{$port}";
        
        return Inertia::render('Client/VideoStation/Widgets', [
            'station' => $this->getCommonStationData($station),
            'urls' => [
                'public_page' => "{$scheme}://{$domain}{$portSuffix}/public/canaltv/{$station->slug}",
                'admin_url' => "http://{$domain}:{$station->port}/admin",
                'hls_url' => "http://{$domain}:{$station->port}/hls/live.m3u8",
            ],
        ]);
    }

    public function publicVideo(Station $station)
    {
        $this->ensureOwnership($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $port = request()->getPort();
        $scheme = request()->getScheme();
        $portSuffix = ($port == 80 || $port == 443) ? '' : ":{$port}";

        return Inertia::render('Client/VideoStation/PublicPage', [
            'station' => $this->getCommonStationData($station),
            'url' => "{$scheme}://{$domain}{$portSuffix}/public/canaltv/{$station->slug}",
        ]);
    }

    public function reportsVideo(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/VideoStation/Reports', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function suspendVideo(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/VideoStation/Suspend', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    public function deleteVideo(Station $station)
    {
        $this->ensureOwnership($station);
        return Inertia::render('Client/VideoStation/Delete', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    /* =========================================================================
       MUTATING POST ACTIONS
       ========================================================================= */

    public function updateConfig(Request $request, Station $station)
    {
        $this->ensureOwnership($station);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'bitrate' => ['sometimes', 'integer', 'in:64,128,192,320'],
            'max_listeners' => ['sometimes', 'integer', 'min:10', 'max:5000'],
            'custom_domain' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $station->update($validated);

        return back()->with('success', 'Configuración actualizada correctamente.');
    }

    public function updateConfigVideo(Request $request, Station $station)
    {
        $this->ensureOwnership($station);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'max_listeners' => ['sometimes', 'integer', 'min:10', 'max:9999'],
            'custom_domain' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'stream_targets' => ['sometimes', 'nullable', 'array'],
        ]);

        $station->update($validated);

        // Regenerate configuration structure (nginx/docker compose) and reload/restart if online
        $this->orchestrator->setup($station);
        if ($station->status === 'online') {
            $this->orchestrator->restart($station);
        }

        return back()->with('success', 'Configuración del Canal de Video y Stream Targets actualizada correctamente.');
    }

    public function uploadFile(Request $request, Station $station)
    {
        $this->ensureOwnership($station);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:mp3,ogg,flac,wav,mp4,m4a', 'max:3145728'],
        ]);

        $file = $validated['file'];
        $path = $file->store("stations/{$station->id}/media", 'public');

        MediaFile::create([
            'station_id' => $station->id,
            'filename' => $file->getClientOriginalName(),
            'filepath' => $path,
            'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'artist' => 'Unknown',
            'duration' => rand(120, 300), // Random simulated duration in seconds
            'size' => $file->getSize(),
        ]);

        return back()->with('success', 'Archivo subido correctamente.');
    }

    public function deleteFile(Station $station, MediaFile $file)
    {
        $this->ensureOwnership($station);

        if ($file->station_id !== $station->id) {
            abort(403);
        }

        Storage::disk('public')->delete($file->filepath);
        $file->delete();

        return back()->with('success', 'Archivo eliminado correctamente.');
    }

    public function toggleStatus(Station $station)
    {
        $this->ensureOwnership($station);

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

        return back()->with('error', 'Ocurrió un error: ' . $result['output']);
    }

    public function toggleStatusVideo(Station $station)
    {
        return $this->toggleStatus($station);
    }

    public function restartStation(Station $station)
    {
        $this->ensureOwnership($station);

        $result = $this->orchestrator->restart($station);

        if ($result['success']) {
            return back()->with('success', 'Servicios reiniciados con éxito.');
        }

        return back()->with('error', 'Error al reiniciar: ' . $result['output']);
    }

    public function restartStationVideo(Station $station)
    {
        return $this->restartStation($station);
    }

    public function suspendStation(Station $station)
    {
        $this->ensureOwnership($station);

        $station->is_active = !$station->is_active;
        $station->status = $station->is_active ? 'offline' : 'suspended';
        $station->save();

        if ($station->status === 'suspended') {
            $this->orchestrator->stop($station);
        }

        $statusMsg = $station->is_active ? 'servicio reactivado' : 'servicio suspendido';
        return redirect()->route('dashboard')->with('success', "El {$statusMsg} con éxito.");
    }

    public function suspendStationVideo(Station $station)
    {
        return $this->suspendStation($station);
    }

    public function deleteStation(Station $station)
    {
        $this->ensureOwnership($station);

        $this->orchestrator->stop($station);
        
        // Delete related files
        foreach ($station->mediaFiles as $file) {
            Storage::disk('public')->delete($file->filepath);
            $file->delete();
        }

        $station->delete();

        return redirect()->route('dashboard')->with('success', 'Servicio eliminado permanentemente.');
    }

    public function deleteStationVideo(Station $station)
    {
        return $this->deleteStation($station);
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }

    public function viewPublicAudio($slug)
    {
        $station = Station::where('slug', $slug)->where('type', 'audio')->firstOrFail();
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $realStats = $this->orchestrator->getRealStats($station);

        $videoPlayerSettings = [
            'default_video_player' => \App\Models\Setting::get('default_video_player', 'videojs'),
            'enable_videojs' => \App\Models\Setting::get('enable_videojs', '1') === '1',
            'enable_clappr' => \App\Models\Setting::get('enable_clappr', '0') === '1',
            'enable_html5_generic' => \App\Models\Setting::get('enable_html5_generic', '1') === '1',
            'default_audio_player_iframe' => \App\Models\Setting::get('default_audio_player_iframe', ''),
            'default_video_player_iframe' => \App\Models\Setting::get('default_video_player_iframe', ''),
        ];
        
        return Inertia::render('Public/AudioPlayer', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'status' => $station->status,
                'port' => $station->port,
                'now_playing' => $station->status === 'online' ? $realStats['now_playing'] : 'Transmisión Fuera de Línea',
                'stream_url' => "http://{$domain}:{$station->port}/radio.mp3",
            ],
            'app' => [
                'logo' => \App\Models\Setting::get('app_logo', ''),
                'favicon' => \App\Models\Setting::get('app_favicon', ''),
                'name' => \App\Models\Setting::get('app_name', 'TuiStream'),
            ],
            'videoPlayerSettings' => $videoPlayerSettings
        ]);
    }

    public function viewPublicVideo($slug)
    {
        $station = Station::where('slug', $slug)->where('type', 'video')->firstOrFail();
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $realStats = $this->orchestrator->getRealStats($station);

        $videoPlayerSettings = [
            'default_video_player' => \App\Models\Setting::get('default_video_player', 'videojs'),
            'enable_videojs' => \App\Models\Setting::get('enable_videojs', '1') === '1',
            'enable_clappr' => \App\Models\Setting::get('enable_clappr', '0') === '1',
            'enable_html5_generic' => \App\Models\Setting::get('enable_html5_generic', '1') === '1',
            'default_audio_player_iframe' => \App\Models\Setting::get('default_audio_player_iframe', ''),
            'default_video_player_iframe' => \App\Models\Setting::get('default_video_player_iframe', ''),
        ];
        
        return Inertia::render('Public/VideoPlayer', [
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'slug' => $station->slug,
                'status' => $station->status,
                'port' => $station->port,
                'now_playing' => $station->status === 'online' ? $realStats['now_playing'] : 'Transmisión Fuera de Línea',
                'hls_url' => "http://{$domain}:{$station->port}/hls/live.m3u8",
                'stream_url' => "http://{$domain}:{$station->port}/hls/live.m3u8",
            ],
            'app' => [
                'logo' => \App\Models\Setting::get('app_logo', ''),
                'favicon' => \App\Models\Setting::get('app_favicon', ''),
                'name' => \App\Models\Setting::get('app_name', 'TuiStream'),
            ],
            'videoPlayerSettings' => $videoPlayerSettings
        ]);
    }

    public function youtubePage(Station $station)
    {
        $this->ensureOwnership($station);
        
        $playlists = \Modules\AutoDJ\Models\Playlist::where('station_id', $station->id)
            ->select('id', 'name')
            ->get();
            
        $jobs = array_values(\Illuminate\Support\Facades\Cache::get('youtube_downloader_jobs', []));
        
        // Filter jobs by this station_id
        $jobs = array_filter($jobs, function ($job) use ($station) {
            return isset($job['station_id']) && (string)$job['station_id'] === (string)$station->id;
        });
        
        // Sort by created_at desc
        usort($jobs, function ($a, $b) {
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        });

        return Inertia::render('Client/YouTubeDownloader', [
            'station' => $this->getCommonStationData($station),
            'playlists' => $playlists,
            'jobs' => array_values($jobs),
        ]);
    }

    public function youtubeDownload(Request $request, Station $station)
    {
        $this->ensureOwnership($station);

        $validated = $request->validate([
            'url' => 'required|url',
            'format' => 'required|in:audio,video',
            'quality' => 'required|string',
            'playlist' => 'required|string',
        ]);

        $jobId = uniqid('yt_', true);
        
        $jobData = [
            'id' => $jobId,
            'url' => $validated['url'],
            'title' => 'Cargando información...',
            'format' => $validated['format'],
            'quality' => $validated['format'] === 'audio' ? $validated['quality'] . ' kbps' : $validated['quality'],
            'station_name' => $station->name,
            'station_id' => $station->id,
            'status' => 'pending',
            'progress' => 0,
            'created_at' => now()->format('d/m/Y H:i'),
        ];

        $jobs = \Illuminate\Support\Facades\Cache::get('youtube_downloader_jobs', []);
        $jobs[$jobId] = $jobData;
        \Illuminate\Support\Facades\Cache::put('youtube_downloader_jobs', $jobs, 86400);

        // Dispatch background job
        \App\Jobs\DownloadYouTube::dispatch(
            $jobId,
            $validated['url'],
            $validated['format'],
            $validated['quality'],
            $station->id,
            $validated['playlist']
        );

        return redirect()->back()->with('success', 'Descarga de YouTube encolada correctamente.');
    }

    public function webPlayerPage(Station $station)
    {
        $this->ensureOwnership($station);
        
        return Inertia::render('Client/WebPlayer', [
            'station' => $this->getCommonStationData($station),
        ]);
    }

    /* =========================================================================
       DJ MANAGER CRUD
       ========================================================================= */

    public function djsList(Station $station)
    {
        $this->ensureOwnership($station);
        $djs = \Modules\Stations\Models\StationDj::where('station_id', $station->id)
            ->select('id', 'name', 'username', 'is_active', 'streams_count', 'created_at')
            ->latest()
            ->get();
        return response()->json($djs);
    }

    public function djsStore(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:100|unique:station_djs,username',
            'password' => 'required|string|min:6',
        ]);

        $dj = \Modules\Stations\Models\StationDj::create([
            'station_id' => $station->id,
            'name' => $validated['name'],
            'username' => $validated['username'],
            'password' => bcrypt($validated['password']),
            'is_active' => true,
        ]);

        return response()->json(['success' => true, 'dj' => $dj->makeHidden('password')]);
    }

    public function djsUpdate(Request $request, Station $station, \Modules\Stations\Models\StationDj $dj)
    {
        $this->ensureOwnership($station);
        if ($dj->station_id !== $station->id) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|max:100|unique:station_djs,username,' . $dj->id,
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        $data = array_filter($validated, fn($v) => $v !== null);
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }
        $dj->update($data);

        return response()->json(['success' => true, 'dj' => $dj->makeHidden('password')]);
    }

    public function djsDestroy(Station $station, \Modules\Stations\Models\StationDj $dj)
    {
        $this->ensureOwnership($station);
        if ($dj->station_id !== $station->id) abort(403);
        $dj->delete();
        return response()->json(['success' => true]);
    }

    public function djsToggle(Station $station, \Modules\Stations\Models\StationDj $dj)
    {
        $this->ensureOwnership($station);
        if ($dj->station_id !== $station->id) abort(403);
        $dj->update(['is_active' => !$dj->is_active]);
        return response()->json(['success' => true, 'is_active' => $dj->is_active]);
    }

    /* =========================================================================
       PLAYLISTS CRUD
       ========================================================================= */

    public function playlistsList(Station $station)
    {
        $this->ensureOwnership($station);
        $playlists = \Modules\AutoDJ\Models\Playlist::where('station_id', $station->id)
            ->withCount('mediaFiles')
            ->select('id', 'station_id', 'name', 'type', 'is_active', 'play_mode', 'created_at')
            ->latest()
            ->get();
        return response()->json($playlists);
    }

    public function playlistsStore(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:standard,scheduled,weighted',
            'play_mode' => 'sometimes|in:sequential,shuffle',
        ]);

        $playlist = \Modules\AutoDJ\Models\Playlist::create([
            'station_id' => $station->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'play_mode' => $validated['play_mode'] ?? 'sequential',
            'is_active' => true,
        ]);

        return response()->json(['success' => true, 'playlist' => $playlist]);
    }

    public function playlistsUpdate(Request $request, Station $station, \Modules\AutoDJ\Models\Playlist $playlist)
    {
        $this->ensureOwnership($station);
        if ($playlist->station_id !== $station->id) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:standard,scheduled,weighted',
            'play_mode' => 'sometimes|in:sequential,shuffle',
        ]);

        $playlist->update($validated);
        return response()->json(['success' => true, 'playlist' => $playlist]);
    }

    public function playlistsDestroy(Station $station, \Modules\AutoDJ\Models\Playlist $playlist)
    {
        $this->ensureOwnership($station);
        if ($playlist->station_id !== $station->id) abort(403);
        $playlist->delete();
        return response()->json(['success' => true]);
    }

    public function playlistsToggle(Station $station, \Modules\AutoDJ\Models\Playlist $playlist)
    {
        $this->ensureOwnership($station);
        if ($playlist->station_id !== $station->id) abort(403);
        $playlist->update(['is_active' => !$playlist->is_active]);
        return response()->json(['success' => true, 'is_active' => $playlist->is_active]);
    }

    public function playlistsAddMedia(Request $request, Station $station, \Modules\AutoDJ\Models\Playlist $playlist)
    {
        $this->ensureOwnership($station);
        if ($playlist->station_id !== $station->id) abort(403);

        $validated = $request->validate([
            'media_ids' => 'required|array',
            'media_ids.*' => 'integer|exists:media_files,id',
        ]);

        $existingIds = $playlist->mediaFiles()->pluck('media_files.id')->toArray();
        $newIds = array_diff($validated['media_ids'], $existingIds);
        if (!empty($newIds)) {
            $playlist->mediaFiles()->attach($newIds);
        }

        return response()->json(['success' => true, 'added' => count($newIds)]);
    }

    public function playlistsRemoveMedia(Request $request, Station $station, \Modules\AutoDJ\Models\Playlist $playlist)
    {
        $this->ensureOwnership($station);
        if ($playlist->station_id !== $station->id) abort(403);

        $validated = $request->validate([
            'media_id' => 'required|integer|exists:media_files,id',
        ]);

        $playlist->mediaFiles()->detach($validated['media_id']);
        return response()->json(['success' => true]);
    }
}
