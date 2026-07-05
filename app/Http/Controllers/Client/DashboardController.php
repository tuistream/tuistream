<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Models\TvChannel;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $clientId = auth()->id();

        $stations = Station::where('client_id', $clientId)->get();
        $tvChannels = TvChannel::where('client_id', $clientId)->get();

        $totalBroadcastTime = $stations->sum('total_listening_time') + $tvChannels->sum(function ($ch) {
            return $ch->last_stream_started_at
                ? now()->diffInSeconds($ch->last_stream_started_at)
                : 0;
        });

        return Inertia::render('Client/Dashboard', [
            'stats' => [
                'total_streams' => $stations->count(),
                'active_listeners' => $stations->sum('current_listeners'),
                'total_tv_channels' => $tvChannels->count(),
                'total_broadcast_time' => $totalBroadcastTime,
                'active_viewers' => $tvChannels->sum('current_viewers'),
            ],
            'stations' => $stations,
            'tv_channels' => $tvChannels,
        ]);
    }
}
