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
                'public_page' => "{$scheme}://{$domain}{$portSuffix}/radio/{$station->slug}",
                'admin_url' => "http://{$domain}:{$station->port}/admin",
                'stream_http' => "http://{$domain}:{$station->port}/radio.mp3",
                'stream_https' => "https://{$domain}:{$station->port}/radio.mp3",
                'stream_proxy_url' => \App\Models\Setting::get('stream_proxy_url_' . $station->id, "https://{$domain}:{$station->port}/radio.mp3"),
                'm3u_playlist' => \App\Models\Setting::get('m3u_playlist_' . $station->id, "https://{$domain}:{$station->port}/radio.m3u"),
                'listeners_url' => \App\Models\Setting::get('listeners_url_' . $station->id, "https://{$domain}:{$station->port}/status-json.xsl"),
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

    /* =========================================================================
       JINGLES CRUD
       ========================================================================= */

    public function jinglesList(Station $station)
    {
        $this->ensureOwnership($station);
        $jingles = $station->jingles()->latest()->get()->map(fn($j) => [
            'id' => $j->id,
            'name' => $j->name,
            'filename' => $j->filename,
            'path' => $j->path,
            'url' => asset('storage/' . $j->path),
            'duration' => $j->duration,
            'interval' => $j->interval,
            'is_active' => $j->is_active,
            'created_at' => $j->created_at->format('d/m/Y'),
        ]);
        return response()->json(['jingles' => $jingles]);
    }

    public function jinglesStore(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'file' => 'required|file|mimes:mp3,wav,ogg,flac|max:102400',
            'interval' => 'sometimes|integer|min:1|max:999',
        ]);

        $path = $request->file('file')->store("stations/{$station->id}/jingles", 'public');
        
        $duration = 0;
        try {
            $fullPath = storage_path("app/public/{$path}");
            $ffprobe = \Symfony\Component\Process\Process::fromShellCommandline(
                'ffprobe -v error -show_entries format=duration -of csv=p=0 ' . escapeshellarg($fullPath)
            );
            $ffprobe->run();
            if ($ffprobe->isSuccessful()) {
                $duration = (int) round((float) trim($ffprobe->getOutput()));
            }
        } catch (\Throwable $e) {
            // fallback to 0
        }

        $jingle = $station->jingles()->create([
            'name' => $validated['name'],
            'filename' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'duration' => $duration,
            'interval' => $validated['interval'] ?? 4,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'jingle' => [
                'id' => $jingle->id,
                'name' => $jingle->name,
                'filename' => $jingle->filename,
                'duration' => $duration,
                'interval' => $jingle->interval,
                'is_active' => $jingle->is_active,
                'created_at' => $jingle->created_at->format('d/m/Y'),
            ],
            'message' => 'Jingle subido correctamente.',
        ]);
    }

    public function jinglesUpdate(Request $request, Station $station, $jingleId)
    {
        $this->ensureOwnership($station);
        $jingle = $station->jingles()->findOrFail($jingleId);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'interval' => 'sometimes|integer|min:1|max:999',
            'is_active' => 'sometimes|boolean',
        ]);

        $jingle->update($validated);

        return response()->json(['success' => true, 'message' => 'Jingle actualizado.']);
    }

    public function jinglesDestroy(Station $station, $jingleId)
    {
        $this->ensureOwnership($station);
        $jingle = $station->jingles()->findOrFail($jingleId);
        \Illuminate\Support\Facades\Storage::disk('public')->delete($jingle->path);
        $jingle->delete();
        return response()->json(['success' => true]);
    }

    public function jinglesSettings(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'interval' => 'required|integer|min:1|max:999',
        ]);

        $station->jingles()->update(['interval' => $validated['interval']]);
        return response()->json(['success' => true, 'message' => 'Intervalo de jingles actualizado.']);
    }

    /* =========================================================================
       SCHEDULE CRUD
       ========================================================================= */

    public function scheduleList(Station $station)
    {
        $this->ensureOwnership($station);
        $slots = $station->scheduleSlots()->orderBy('day')->orderBy('start_time')->get()->map(fn($s) => [
            'id' => $s->id,
            'day' => $s->day,
            'day_name' => $this->dayName($s->day),
            'start_time' => $s->start_time,
            'end_time' => $s->end_time,
            'type' => $s->type,
            'playlist_id' => $s->playlist_id,
            'playlist_name' => $s->playlist?->name,
            'title' => $s->title,
        ]);
        return response()->json(['slots' => $slots]);
    }

    public function scheduleStore(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'day' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:rotation,dj_live,playlist,jingles',
            'playlist_id' => 'nullable|integer|exists:playlists,id',
            'title' => 'sometimes|string|max:255',
        ]);

        // Validar que no haya solapamiento
        $overlap = $station->scheduleSlots()
            ->where('day', $validated['day'])
            ->where(fn($q) => $q
                ->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                ->orWhere(fn($q2) => $q2
                    ->where('start_time', '<=', $validated['start_time'])
                    ->where('end_time', '>=', $validated['end_time'])
                )
            )->exists();

        if ($overlap) {
            return response()->json(['error' => 'El horario se solapa con otro evento.'], 422);
        }

        $slot = $station->scheduleSlots()->create($validated);

        return response()->json([
            'success' => true,
            'slot' => [
                'id' => $slot->id,
                'day' => $slot->day,
                'day_name' => $this->dayName($slot->day),
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'type' => $slot->type,
                'playlist_id' => $slot->playlist_id,
                'playlist_name' => $slot->playlist?->name,
                'title' => $slot->title,
            ],
        ]);
    }

    public function scheduleDestroy(Station $station, $slotId)
    {
        $this->ensureOwnership($station);
        $station->scheduleSlots()->where('id', $slotId)->delete();
        return response()->json(['success' => true]);
    }

    private function dayName(int $day): string
    {
        $names = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];
        return $names[$day] ?? 'Desconocido';
    }

    /* =========================================================================
       MOUNT POINTS CRUD
       ========================================================================= */

    public function mountPointsList(Station $station)
    {
        $this->ensureOwnership($station);
        $points = $station->mountPoints()->latest()->get()->map(fn($m) => [
            'id' => $m->id,
            'path' => $m->path,
            'bitrate' => $m->bitrate,
            'format' => $m->format,
            'is_default' => $m->is_default,
            'is_public' => $m->is_public ?? true,
        ]);
        return response()->json(['mount_points' => $points]);
    }

    public function mountPointsStore(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'path' => 'required|string|max:255|starts_with:/',
            'bitrate' => 'required|integer|min:16|max:320',
            'format' => 'required|in:MP3,AAC,OGG,FLAC',
            'is_default' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            $station->mountPoints()->update(['is_default' => false]);
        }

        $mount = $station->mountPoints()->create($validated);

        return response()->json([
            'success' => true,
            'mount_point' => [
                'id' => $mount->id,
                'path' => $mount->path,
                'bitrate' => $mount->bitrate,
                'format' => $mount->format,
                'is_default' => $mount->is_default,
                'is_public' => $mount->is_public ?? true,
            ],
            'message' => 'Punto de montaje creado.',
        ]);
    }

    public function mountPointsUpdate(Request $request, Station $station, $mountId)
    {
        $this->ensureOwnership($station);
        $mount = $station->mountPoints()->findOrFail($mountId);

        $validated = $request->validate([
            'path' => 'sometimes|string|max:255|starts_with:/',
            'bitrate' => 'sometimes|integer|min:16|max:320',
            'format' => 'sometimes|in:MP3,AAC,OGG,FLAC',
            'is_default' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            $station->mountPoints()->where('id', '!=', $mountId)->update(['is_default' => false]);
        }

        $mount->update($validated);

        return response()->json(['success' => true, 'message' => 'Punto de montaje actualizado.']);
    }

    public function mountPointsDestroy(Station $station, $mountId)
    {
        $this->ensureOwnership($station);
        $mount = $station->mountPoints()->findOrFail($mountId);
        if ($mount->is_default) {
            return response()->json(['error' => 'No se puede eliminar el punto de montaje predeterminado.'], 422);
        }
        $mount->delete();
        return response()->json(['success' => true]);
    }

    /* =========================================================================
       SONG TITLE / METADATA
       ========================================================================= */

    public function songTitleAudio(Station $station)
    {
        $this->ensureOwnership($station);
        $nowPlaying = cache("station_now_playing:{$station->id}", 'Reproduciendo…');
        
        return Inertia::render('Client/AudioStation/SongTitle', [
            'station' => $this->getCommonStationData($station),
            'now_playing' => $nowPlaying,
        ]);
    }

    public function songTitleUpdate(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        cache(["station_now_playing:{$station->id}" => $validated['title']], 3600);
        
        // Intentar actualizar Icecast metadata via admin endpoint
        try {
            $adminPass = \App\Models\Setting::get('icecast_admin_password', '');
            $domain = \App\Models\Setting::get('server_domain', '127.0.0.1');
            $url = "http://icecast:8000/admin/metadata?mode=updinfo&mount=/radio.mp3&song=" . urlencode($validated['title']);
            
            $ctx = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "Authorization: Basic " . base64_encode("admin:{$adminPass}"),
                    'timeout' => 2,
                ]
            ]);
            @file_get_contents($url, false, $ctx);
        } catch (\Throwable $e) {
            // metadata update es best-effort
        }

        return response()->json([
            'success' => true,
            'now_playing' => $validated['title'],
            'message' => 'Metadato del Stream actualizado correctamente.',
        ]);
    }

    /* =========================================================================
       WIDGETS SETTINGS (SAVE)
       ========================================================================= */

    public function widgetsSave(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'stream_proxy_url' => 'sometimes|nullable|url|max:500',
            'm3u_playlist' => 'sometimes|nullable|url|max:500',
            'listeners_url' => 'sometimes|nullable|url|max:500',
        ]);

        foreach ($validated as $key => $value) {
            \App\Models\Setting::set($key . '_' . $station->id, $value ?? '');
        }

        return response()->json(['success' => true, 'message' => 'Widgets guardados correctamente.']);
    }

    /* =========================================================================
       ICECAST CONNECTION SETTINGS
       ========================================================================= */

    public function icecastConnectionGet(Station $station)
    {
        $this->ensureOwnership($station);
        $prefix = "station_{$station->id}_icecast_";
        return response()->json([
            'server' => \App\Models\Setting::get($prefix . 'server', $station->server_domain ?? 'icecast'),
            'port' => (int) \App\Models\Setting::get($prefix . 'port', $station->port),
            'mount_point' => \App\Models\Setting::get($prefix . 'mount', '/radio.mp3'),
            'source_password' => \App\Models\Setting::get($prefix . 'source_pass', $station->stream_key ?? ''),
            'admin_password' => \App\Models\Setting::get($prefix . 'admin_pass', ''),
        ]);
    }

    public function icecastConnectionSave(Request $request, Station $station)
    {
        $this->ensureOwnership($station);
        $validated = $request->validate([
            'server' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'mount_point' => 'required|string|max:255|starts_with:/',
            'source_password' => 'required|string|min:4|max:128',
            'admin_password' => 'required|string|min:4|max:128',
        ]);

        $prefix = "station_{$station->id}_icecast_";
        \App\Models\Setting::set($prefix . 'server', $validated['server']);
        \App\Models\Setting::set($prefix . 'port', (string) $validated['port']);
        \App\Models\Setting::set($prefix . 'mount', $validated['mount_point']);
        \App\Models\Setting::set($prefix . 'source_pass', $validated['source_password']);
        \App\Models\Setting::set($prefix . 'admin_pass', $validated['admin_password']);

        return response()->json(['success' => true, 'message' => 'Configuración de Icecast guardada correctamente.']);
    }

    /* =========================================================================
       AUTODJ CONNECTION GUIDE
       ========================================================================= */

    public function autodjConnectionInfo(Station $station)
    {
        $this->ensureOwnership($station);
        $domain = \App\Models\Setting::get('server_domain', request()->getHost());
        $streamPass = \App\Models\Setting::get("station_{$station->id}_icecast_source_pass", $station->stream_key ?? 'tu_stream_key');

        return response()->json([
            'engine' => 'Liquidsoap 2.2.5',
            'crossfade' => '2.5 segundos',
            'mode' => 'Rotación aleatoria adaptativa',
            'connection' => [
                'type' => 'Icecast',
                'host' => $domain,
                'port' => $station->port,
                'mount' => '/radio.mp3',
                'source_password' => $streamPass,
                'encoder' => 'MP3',
                'bitrate' => $station->bitrate . ' kbps',
            ],
            'dj_live' => [
                'host' => $domain,
                'port' => $station->dj_port,
                'mount' => '/live',
                'password' => 'dj_' . $station->slug,
                'protocol' => 'Icecast Source Client',
            ],
            'steps' => [
                'Paso 1: Abre tu encoder (BUTT, Mixxx, OBS) y ve a la configuración de servidor.',
                'Paso 2: Selecciona tipo de servidor "Icecast 2".',
                "Paso 3: Ingresa Host: {$domain}, Puerto: {$station->port}, Mount: /radio.mp3.",
                "Paso 4: Usa como Source Password: {$streamPass}.",
                "Paso 5: Si quieres emitir como DJ en vivo, usa el mount /live con el puerto {$station->dj_port}.",
                'Paso 6: Inicia la transmisión desde tu encoder. Si todo es correcto, tu stream estará online en segundos.',
            ],
        ]);
    }
}