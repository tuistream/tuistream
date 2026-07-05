<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use App\Models\Station;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class StationController extends Controller
{
    private function scopedQuery()
    {
        $user = auth()->user();

        return Station::query()
            ->where('client_id', $user->id)
            ->with('client:id,name,email');
    }

    private function findStation(int|string $id): Station
    {
        return $this->scopedQuery()->findOrFail($id);
    }

    public function index(): JsonResponse
    {
        Log::channel('external_api')->info('stations.index', [
            'user_id' => auth()->id(),
            'ip'      => request()->ip(),
        ]);

        $stations = $this->scopedQuery()
            ->orderBy('name')
            ->get()
            ->makeHidden(['source_password', 'admin_password']);

        return response()->json(['data' => $stations]);
    }

    public function show(Station $station): JsonResponse
    {
        abort_unless($station->client_id === auth()->id(), 404);

        Log::channel('external_api')->info('stations.show', [
            'user_id'    => auth()->id(),
            'station_id' => $station->id,
        ]);

        $station->load([
            'playlists.media',
            'playlists.schedules',
        ])->makeHidden(['source_password', 'admin_password']);

        return response()->json(['data' => $station]);
    }

    public function listeners(Station $station): JsonResponse
    {
        abort_unless($station->client_id === auth()->id(), 404);

        return response()->json([
            'data' => [
                'station_id'       => $station->id,
                'current_listeners' => (int) ($station->current_listeners ?? 0),
                'peak_listeners'    => (int) ($station->peak_listeners ?? 0),
                'max_listeners'     => (int) $station->max_listeners,
                'bitrate'           => (int) $station->bitrate,
                'audio_format'      => $station->audio_format,
                'is_active'         => (bool) $station->is_active,
                'current_song'      => $station->current_song,
            ],
        ]);
    }

    public function songHistory(Station $station): JsonResponse
    {
        abort_unless($station->client_id === auth()->id(), 404);

        $history = $station->songHistory()
            ->latest('played_at')
            ->limit(50)
            ->get(['title', 'artist', 'album', 'played_at', 'duration']);

        return response()->json(['data' => $history]);
    }
}
