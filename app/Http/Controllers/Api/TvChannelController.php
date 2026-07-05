<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TvChannel;
use App\Services\Streaming\VideoStreamingService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TvChannelController extends Controller
{
    protected function visibleChannels()
    {
        $query = TvChannel::query();

        if (!auth()->user()->isAdmin()) {
            $query->where('client_id', auth()->id());
        }

        return $query;
    }

    protected function authorizeChannel(TvChannel $channel): TvChannel
    {
        abort_unless(auth()->user()->isAdmin() || $channel->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $channel;
    }

    public function index()
    {
        return $this->visibleChannels()
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
            'channel_type' => 'required|in:tv_247,web_tv,visual_radio,live_event',
            'resolution' => 'string',
            'bitrate' => 'integer|min:500',
        ]);

        $data['slug'] = \Illuminate\Support\Str::slug($data['name']);

        $channel = TvChannel::create($data);

        // Generate stream URLs
        app(\App\Services\Streaming\VideoStreamingService::class)->createChannel($channel);

        return response()->json($channel, 201);
    }

    public function show(TvChannel $channel)
    {
        $channel = $this->authorizeChannel($channel);

        return $channel->load([
            'client:id,name',
            'schedules.media',
        ]);
    }

    public function update(Request $request, TvChannel $channel)
    {
        $channel = $this->authorizeChannel($channel);

        $data = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'resolution' => 'string',
            'bitrate' => 'integer|min:500',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'auto_schedule_enabled' => 'boolean',
            'current_program' => 'nullable|string|max:255',
        ]);

        $channel->update($data);

        return response()->json($channel->fresh(['schedules.media']));
    }

    public function destroy(TvChannel $channel)
    {
        $channel = $this->authorizeChannel($channel);
        $channel->delete();

        return response()->json(null, 204);
    }

    public function start(TvChannel $channel, VideoStreamingService $videoStreamingService)
    {
        $channel = $this->authorizeChannel($channel);

        $started = $videoStreamingService->startAutoSchedule($channel);

        if (!$started) {
            return response()->json(['message' => 'No fue posible iniciar la transmision de video.'], 422);
        }

        $channel->update([
            'is_active' => true,
            'auto_schedule_enabled' => true,
        ]);

        return response()->json([
            'message' => 'Canal de video iniciado correctamente.',
            'channel' => $channel->fresh(['schedules.media']),
        ]);
    }

    public function stop(TvChannel $channel, VideoStreamingService $videoStreamingService)
    {
        $channel = $this->authorizeChannel($channel);

        $stopped = $videoStreamingService->stopStream($channel);

        if (!$stopped) {
            return response()->json(['message' => 'No fue posible detener la transmision de video.'], 422);
        }

        $channel->update([
            'is_active' => false,
            'current_program' => null,
        ]);

        return response()->json([
            'message' => 'Canal de video detenido correctamente.',
            'channel' => $channel->fresh(['schedules.media']),
        ]);
    }
}
