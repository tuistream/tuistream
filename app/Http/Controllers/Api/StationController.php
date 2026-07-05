<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Services\Streaming\AutoDJService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StationController extends Controller
{
    protected function visibleStations()
    {
        $query = Station::query();

        if (!auth()->user()->isAdmin()) {
            $query->where('client_id', auth()->id());
        }

        return $query;
    }

    protected function authorizeStation(Station $station): Station
    {
        abort_unless(auth()->user()->isAdmin() || $station->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $station;
    }

    public function index()
    {
        return $this->visibleStations()
            ->with('client:id,name')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:users,id',
            'description' => 'nullable|string',
            'genre' => 'nullable|string',
            'bitrate' => 'required|integer|min:32|max:320',
            'audio_format' => 'required|in:mp3,aac,ogg',
            'max_listeners' => 'required|integer|min:1',
            'auto_dj_enabled' => 'boolean',
        ]);

        $data['slug'] = \Illuminate\Support\Str::slug($data['name']);
        $data['source_password'] = \Illuminate\Support\Str::random(16);
        $data['admin_password'] = \Illuminate\Support\Str::random(16);

        $station = Station::create($data);

        return response()->json($station, 201);
    }

    public function show(Station $station)
    {
        $station = $this->authorizeStation($station);

        return $station->load([
            'client:id,name',
            'playlists.media',
            'playlists.schedules',
            'djAccounts',
            'songHistory' => fn ($query) => $query->latest('played_at')->limit(12),
        ]);
    }

    public function update(Request $request, Station $station)
    {
        $station = $this->authorizeStation($station);

        $data = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'genre' => 'nullable|string',
            'website_url' => 'nullable|url',
            'bitrate' => 'integer|min:32|max:320',
            'audio_format' => 'in:mp3,aac,ogg',
            'max_listeners' => 'integer|min:1',
            'auto_dj_enabled' => 'boolean',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'mount_point' => 'nullable|string|max:255',
        ]);

        $station->update($data);

        return response()->json($station->fresh(['playlists.media', 'playlists.schedules']));
    }

    public function destroy(Station $station)
    {
        $station = $this->authorizeStation($station);
        $station->delete();

        return response()->json(null, 204);
    }

    public function start(Station $station, AutoDJService $autoDJService)
    {
        $station = $this->authorizeStation($station);

        $started = $autoDJService->start($station);

        if (!$started) {
            return response()->json(['message' => 'No fue posible iniciar el AutoDJ.'], 422);
        }

        $station->update([
            'is_active' => true,
            'auto_dj_enabled' => true,
        ]);

        return response()->json([
            'message' => 'AutoDJ iniciado correctamente.',
            'station' => $station->fresh(),
        ]);
    }

    public function stop(Station $station, AutoDJService $autoDJService)
    {
        $station = $this->authorizeStation($station);

        $stopped = $autoDJService->stop($station);

        if (!$stopped) {
            return response()->json(['message' => 'No fue posible detener el AutoDJ.'], 422);
        }

        $station->update([
            'is_active' => false,
            'current_song' => null,
        ]);

        return response()->json([
            'message' => 'AutoDJ detenido correctamente.',
            'station' => $station->fresh(),
        ]);
    }

    public function restart(Station $station, AutoDJService $autoDJService)
    {
        $station = $this->authorizeStation($station);

        $restarted = $autoDJService->restart($station);

        if (!$restarted) {
            return response()->json(['message' => 'No fue posible reiniciar el AutoDJ.'], 422);
        }

        $station->update([
            'is_active' => true,
            'auto_dj_enabled' => true,
        ]);

        return response()->json([
            'message' => 'AutoDJ reiniciado correctamente.',
            'station' => $station->fresh(),
        ]);
    }
}
