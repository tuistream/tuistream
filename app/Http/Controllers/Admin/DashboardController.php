<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Station;
use App\Models\TvChannel;
use App\Models\User;
use App\Models\ServerStat;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $latestStats = ServerStat::latest('recorded_at')->first();

        // Get last 24 stats for chart
        $statHistory = ServerStat::orderBy('recorded_at')
            ->take(24)
            ->get(['cpu_usage', 'ram_usage', 'ram_total', 'disk_usage', 'disk_total', 'active_listeners', 'recorded_at'])
            ->map(function ($stat) {
                return [
                    'cpu' => (int) $stat->cpu_usage,
                    'ram' => $stat->ram_total > 0 ? (int) round(($stat->ram_usage / $stat->ram_total) * 100) : 0,
                    'disk' => $stat->disk_total > 0 ? (int) round(($stat->disk_usage / $stat->disk_total) * 100) : 0,
                    'listeners' => (int) $stat->active_listeners,
                    'time' => $stat->recorded_at->format('H:i'),
                ];
            });

        $ramPct = $latestStats && $latestStats->ram_total > 0
            ? round(($latestStats->ram_usage / $latestStats->ram_total) * 100)
            : 0;
        $diskPct = $latestStats && $latestStats->disk_total > 0
            ? round(($latestStats->disk_usage / $latestStats->disk_total) * 100)
            : 0;

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'active_streams' => Station::where('is_active', true)->count(),
                'active_listeners' => Station::sum('current_listeners'),
                'active_channels' => TvChannel::where('is_active', true)->count(),
                'active_viewers' => TvChannel::sum('current_viewers'),
                'active_clients' => User::role('client')->where('is_active', true)->count(),
                'total_stations' => Station::count(),
                'total_channels' => TvChannel::count(),
                'total_clients' => User::role('client')->count(),
                'cpu_usage' => (int) ($latestStats?->cpu_usage ?? 0),
                'ram_usage' => $ramPct,
                'ram_used' => $latestStats?->ram_usage ?? 0,
                'ram_total' => $latestStats?->ram_total ?? 0,
                'disk_usage' => $diskPct,
                'disk_used' => $latestStats?->disk_usage ?? 0,
                'disk_total' => $latestStats?->disk_total ?? 0,
                'recent_stations' => Station::with('client:id,name')->latest()->take(5)->get(),
                'recent_clients' => User::role('client')->latest()->take(5)->get(),
                'stat_history' => $statHistory->values(),
            ],
        ]);
    }


}
