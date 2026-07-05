<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Playlist;
use App\Models\PlaylistSchedule;
use App\Models\Station;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PlaylistController extends Controller
{
    protected function authorizeStation(Station $station): Station
    {
        abort_unless(auth()->user()->isAdmin() || $station->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $station;
    }

    protected function authorizePlaylist(Playlist $playlist): Playlist
    {
        abort_unless(
            auth()->user()->isAdmin() || $playlist->station?->client_id === auth()->id(),
            Response::HTTP_NOT_FOUND
        );

        return $playlist;
    }

    protected function authorizeMedia(Media $media): Media
    {
        abort_unless(auth()->user()->isAdmin() || $media->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $media;
    }

    public function index(Request $request)
    {
        $station = Station::findOrFail($request->integer('station_id'));
        $this->authorizeStation($station);

        return Playlist::where('station_id', $station->id)
            ->with('media')
            ->with('schedules')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'station_id' => 'required|exists:stations,id',
            'description' => 'nullable|string',
            'is_jingle_playlist' => 'boolean',
            'playback_order' => 'in:sequential,random,weighted',
            'crossfade_duration' => 'integer|min:0|max:30',
        ]);

        $station = Station::findOrFail($data['station_id']);
        $this->authorizeStation($station);

        return Playlist::create($data)->load(['media', 'schedules']);
    }

    public function update(Request $request, Playlist $playlist)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));

        $data = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'playback_order' => 'in:sequential,random,weighted',
            'crossfade_duration' => 'integer|min:0|max:30',
            'is_active' => 'boolean',
            'is_jingle_playlist' => 'boolean',
        ]);

        $playlist->update($data);

        return response()->json($playlist->fresh(['media', 'schedules']));
    }

    public function destroy(Playlist $playlist)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));
        $playlist->delete();

        return response()->json(null, 204);
    }

    public function addMedia(Request $request, Playlist $playlist)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));

        $data = $request->validate([
            'media_id' => 'required|exists:media,id',
            'cue_in' => 'nullable|numeric',
            'cue_out' => 'nullable|numeric',
            'weight' => 'nullable|integer|min:1|max:100',
        ]);

        $media = $this->authorizeMedia(Media::findOrFail($data['media_id']));
        $maxOrder = $playlist->media()->max('playlist_media.order') ?? 0;

        $playlist->media()->syncWithoutDetaching([$media->id => [
            'order' => $maxOrder + 1,
            'weight' => $data['weight'] ?? 1,
            'cue_in' => $data['cue_in'] ?? null,
            'cue_out' => $data['cue_out'] ?? null,
        ]]);

        return response()->json([
            'message' => 'Media agregada correctamente.',
            'playlist' => $playlist->fresh(['media', 'schedules']),
        ]);
    }

    public function removeMedia(Playlist $playlist, $mediaId)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));
        $playlist->media()->detach($mediaId);

        return response()->json(null, 204);
    }

    public function reorder(Request $request, Playlist $playlist)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));

        $request->validate([
            'media_ids' => 'required|array',
            'media_ids.*' => 'exists:media,id',
        ]);

        foreach ($request->media_ids as $index => $mediaId) {
            $playlist->media()->updateExistingPivot($mediaId, ['order' => $index]);
        }

        return response()->json(['message' => 'Playlist reordered']);
    }

    public function storeSchedule(Request $request, Playlist $playlist)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'days_of_week' => 'required|array|min:1',
            'days_of_week.*' => 'integer|min:0|max:6',
            'priority' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $schedule = $playlist->schedules()->create([
            ...$data,
            'priority' => $data['priority'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json($schedule, 201);
    }

    public function updateSchedule(Request $request, Playlist $playlist, PlaylistSchedule $schedule)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));
        abort_unless($schedule->playlist_id === $playlist->id, Response::HTTP_NOT_FOUND);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'days_of_week' => 'sometimes|array|min:1',
            'days_of_week.*' => 'integer|min:0|max:6',
            'priority' => 'sometimes|integer|min:0|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        $schedule->update($data);

        return response()->json($schedule->fresh());
    }

    public function destroySchedule(Playlist $playlist, PlaylistSchedule $schedule)
    {
        $playlist = $this->authorizePlaylist($playlist->load('station'));
        abort_unless($schedule->playlist_id === $playlist->id, Response::HTTP_NOT_FOUND);

        $schedule->delete();

        return response()->json(null, 204);
    }
}
