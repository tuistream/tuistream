<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use App\Models\TvChannel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TvChannelController extends Controller
{
    private function scopedQuery()
    {
        $user = auth()->user();

        return TvChannel::query()
            ->where('client_id', $user->id)
            ->with('client:id,name,email');
    }

    public function index(): JsonResponse
    {
        Log::channel('external_api')->info('tv-channels.index', [
            'user_id' => auth()->id(),
            'ip'      => request()->ip(),
        ]);

        $channels = $this->scopedQuery()
            ->orderBy('name')
            ->get()
            ->makeHidden(['stream_key']);

        return response()->json(['data' => $channels]);
    }

    public function show(TvChannel $channel): JsonResponse
    {
        abort_unless($channel->client_id === auth()->id(), 404);

        Log::channel('external_api')->info('tv-channels.show', [
            'user_id'    => auth()->id(),
            'channel_id' => $channel->id,
        ]);

        $channel->makeHidden(['stream_key', 'source_password']);

        return response()->json(['data' => $channel]);
    }

    public function viewers(TvChannel $channel): JsonResponse
    {
        abort_unless($channel->client_id === auth()->id(), 404);

        return response()->json([
            'data' => [
                'channel_id'        => $channel->id,
                'current_viewers'   => (int) ($channel->current_viewers ?? 0),
                'peak_viewers'      => (int) ($channel->peak_viewers ?? 0),
                'resolution'        => $channel->resolution ?? '1920x1080',
                'is_live'           => (bool) $channel->is_active,
                'hls_url'           => $channel->hls_url,
                'dash_url'          => $channel->dash_url ?? null,
            ],
        ]);
    }

    public function schedule(TvChannel $channel): JsonResponse
    {
        abort_unless($channel->client_id === auth()->id(), 404);

        $schedules = $channel->schedules()
            ->with('media:id,title,duration,file_path')
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get();

        return response()->json(['data' => $schedules]);
    }
}
