<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\TvChannel;
use App\Models\VideoSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VideoScheduleController extends Controller
{
    protected function authorizeChannel(TvChannel $channel): TvChannel
    {
        abort_unless(auth()->user()->isAdmin() || $channel->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $channel;
    }

    protected function authorizeMedia(?Media $media): ?Media
    {
        if (!$media) {
            return null;
        }

        abort_unless(auth()->user()->isAdmin() || $media->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $media;
    }

    public function store(Request $request, TvChannel $channel)
    {
        $channel = $this->authorizeChannel($channel);

        $data = $request->validate([
            'media_id' => 'nullable|exists:media,id',
            'title' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'days_of_week' => 'nullable|array',
            'days_of_week.*' => 'integer|min:0|max:6',
            'repeat_until' => 'nullable|date|after_or_equal:end_time',
            'priority' => 'nullable|integer|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        $media = isset($data['media_id']) ? Media::findOrFail($data['media_id']) : null;
        $this->authorizeMedia($media);

        $schedule = $channel->schedules()->create([
            ...$data,
            'priority' => $data['priority'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json($schedule->load('media'), 201);
    }

    public function update(Request $request, TvChannel $channel, VideoSchedule $schedule)
    {
        $channel = $this->authorizeChannel($channel);
        abort_unless($schedule->tv_channel_id === $channel->id, Response::HTTP_NOT_FOUND);

        $data = $request->validate([
            'media_id' => 'nullable|exists:media,id',
            'title' => 'sometimes|string|max:255',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date',
            'days_of_week' => 'sometimes|array',
            'days_of_week.*' => 'integer|min:0|max:6',
            'repeat_until' => 'nullable|date',
            'priority' => 'sometimes|integer|min:0|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        if (array_key_exists('media_id', $data) && $data['media_id']) {
            $this->authorizeMedia(Media::findOrFail($data['media_id']));
        }

        $schedule->update($data);

        return response()->json($schedule->fresh()->load('media'));
    }

    public function destroy(TvChannel $channel, VideoSchedule $schedule)
    {
        $channel = $this->authorizeChannel($channel);
        abort_unless($schedule->tv_channel_id === $channel->id, Response::HTTP_NOT_FOUND);

        $schedule->delete();

        return response()->json(null, 204);
    }
}
