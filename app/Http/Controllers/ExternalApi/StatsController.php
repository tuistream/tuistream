<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Models\TvChannel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class StatsController extends Controller
{
    public function summary(): JsonResponse
    {
        $userId = auth()->id();

        Log::channel('external_api')->info('stats.summary', [
            'user_id' => $userId,
            'ip'      => request()->ip(),
        ]);

        $stations = Station::where('client_id', $userId)->get();
        $channels = TvChannel::where('client_id', $userId)->get();

        return response()->json([
            'data' => [
                'stations' => [
                    'total'            => $stations->count(),
                    'active'           => $stations->where('is_active', true)->count(),
                    'total_listeners'  => $stations->sum('current_listeners'),
                    'peak_listeners'   => $stations->max('peak_listeners'),
                ],
                'tv_channels' => [
                    'total'          => $channels->count(),
                    'live'           => $channels->where('is_active', true)->count(),
                    'total_viewers'  => $channels->sum('current_viewers'),
                    'peak_viewers'   => $channels->max('peak_viewers'),
                ],
                'media' => [
                    'total_files' => \App\Models\Media::where('client_id', $userId)->count(),
                ],
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }

    public function listenerStats(Station $station): JsonResponse
    {
        abort_unless($station->client_id === auth()->id(), 404);

        $period = request()->get('period', '24h');

        return response()->json([
            'data' => [
                'station_id'       => $station->id,
                'current_listeners' => (int) ($station->current_listeners ?? 0),
                'peak_listeners'    => (int) ($station->peak_listeners ?? 0),
                'period'            => $period,
            ],
        ]);
    }

    public function viewerStats(TvChannel $channel): JsonResponse
    {
        abort_unless($channel->client_id === auth()->id(), 404);

        $period = request()->get('period', '24h');

        return response()->json([
            'data' => [
                'channel_id'      => $channel->id,
                'current_viewers' => (int) ($channel->current_viewers ?? 0),
                'peak_viewers'    => (int) ($channel->peak_viewers ?? 0),
                'period'          => $period,
            ],
        ]);
    }
}
