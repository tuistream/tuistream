<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use App\Models\Playlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PlaylistController extends Controller
{
    private function scopedQuery()
    {
        $user = auth()->user();

        return Playlist::query()
            ->whereHas('station', fn ($q) => $q->where('client_id', $user->id));
    }

    public function index(): JsonResponse
    {
        Log::channel('external_api')->info('playlists.index', [
            'user_id' => auth()->id(),
            'ip'      => request()->ip(),
        ]);

        $playlists = $this->scopedQuery()
            ->with('station:id,name')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $playlists]);
    }

    public function show(Playlist $playlist): JsonResponse
    {
        $this->ensureOwnership($playlist);

        $playlist->load([
            'station:id,name',
            'media',
            'schedules',
        ]);

        return response()->json(['data' => $playlist]);
    }

    public function media(Playlist $playlist): JsonResponse
    {
        $this->ensureOwnership($playlist);

        $items = $playlist->media()
            ->withPivot(['order', 'fade_in', 'fade_out', 'cue_in', 'cue_out'])
            ->orderByPivot('order')
            ->get();

        return response()->json(['data' => $items]);
    }

    private function ensureOwnership(Playlist $playlist): void
    {
        $owns = Playlist::query()
            ->where('id', $playlist->id)
            ->whereHas('station', fn ($q) => $q->where('client_id', auth()->id()))
            ->exists();

        abort_unless($owns, 404);
    }
}
