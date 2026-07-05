<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Models\TvChannel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StatsController extends Controller
{
    protected function authorizeStation(Station $station): Station
    {
        abort_unless(auth()->user()->isAdmin() || $station->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $station;
    }

    protected function authorizeChannel(TvChannel $channel): TvChannel
    {
        abort_unless(auth()->user()->isAdmin() || $channel->client_id === auth()->id(), Response::HTTP_NOT_FOUND);

        return $channel;
    }

    protected function periodStart(string $period): Carbon
    {
        return match ($period) {
            '1h' => now()->subHour(),
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subDay(),
        };
    }

    public function listenerStats(Station $station, Request $request)
    {
        $station = $this->authorizeStation($station);
        $period = $request->get('period', '24h');
        if (!in_array($period, ['1h', '24h', '7d', '30d'])) {
            $period = '24h';
        }
        $stats = $station->listenerStats()
            ->where('connected_at', '>=', $this->periodStart($period))
            ->orderBy('connected_at')
            ->get(['listeners', 'connected_at']);

        return response()->json($stats);
    }

    public function viewerStats(TvChannel $channel, Request $request)
    {
        $channel = $this->authorizeChannel($channel);
        $period = $request->get('period', '24h');
        if (!in_array($period, ['1h', '24h', '7d', '30d'])) {
            $period = '24h';
        }
        $stats = $channel->viewerStats()
            ->where('connected_at', '>=', $this->periodStart($period))
            ->orderBy('connected_at')
            ->get(['viewers', 'connected_at']);

        return response()->json($stats);
    }

    public function serverStats()
    {
        return \App\Models\ServerStat::latest('recorded_at')
            ->take(100)
            ->get();
    }

    public function geoStats(Station $station)
    {
        $station = $this->authorizeStation($station);

        return $station->listenerStats()
            ->whereNotNull('country')
            ->selectRaw('country, COUNT(*) as total')
            ->groupBy('country')
            ->orderByDesc('total')
            ->get();
    }
}
