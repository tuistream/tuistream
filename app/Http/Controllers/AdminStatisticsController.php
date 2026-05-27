<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Modules\Stations\Models\Station;

class AdminStatisticsController extends Controller
{
    public function index()
    {
        $stations = Station::with('user')->latest()->get();
        $clients = User::where('role', 'client')->withCount('stations')->get();

        $audioStations = $stations->where('type', 'audio');
        $videoStations = $stations->where('type', 'video');

        $byStatus = [
            'online' => $stations->where('status', 'online')->count(),
            'offline' => $stations->where('status', 'offline')->count(),
            'error' => $stations->where('status', 'error')->count(),
        ];

        $byFrontend = [
            'icecast' => $audioStations->where('frontend', 'icecast')->count(),
            'shoutcast' => $audioStations->where('frontend', 'shoutcast')->count(),
        ];

        $topClients = $clients->sortByDesc('stations_count')->take(5)->values()->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'email' => $c->email,
            'stations_count' => (int) $c->stations_count,
        ])->toArray();

        $monthlyCreation = $stations->groupBy(fn($s) => $s->created_at->format('Y-m'))
            ->map(fn($group, $month) => [
                'month' => $month,
                'audio' => $group->where('type', 'audio')->count(),
                'video' => $group->where('type', 'video')->count(),
            ])
            ->sortKeys()
            ->values()
            ->toArray();

        return Inertia::render('Admin/Statistics', [
            'summary' => [
                'total_stations' => $stations->count(),
                'audio_stations' => $audioStations->count(),
                'video_stations' => $videoStations->count(),
                'online_stations' => $byStatus['online'],
                'offline_stations' => $byStatus['offline'],
                'error_stations' => $byStatus['error'],
                'total_clients' => $clients->count(),
                'total_listeners' => $stations->where('status', 'online')->sum('max_listeners'),
                'avg_bitrate' => $audioStations->avg('bitrate') ?? 0,
            ],
            'by_status' => [
                ['name' => 'Online', 'value' => $byStatus['online'], 'color' => '#34d399'],
                ['name' => 'Offline', 'value' => $byStatus['offline'], 'color' => '#64748b'],
                ['name' => 'Error', 'value' => $byStatus['error'], 'color' => '#f87171'],
            ],
            'by_frontend' => [
                ['name' => 'Icecast', 'value' => $byFrontend['icecast']],
                ['name' => 'SHOUTcast', 'value' => $byFrontend['shoutcast']],
            ],
            'top_clients' => $topClients,
            'monthly_creation' => $monthlyCreation,
            'stations_detail' => $stations->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'type' => $s->type,
                'status' => $s->status,
                'frontend' => $s->frontend,
                'port' => $s->port,
                'bitrate' => $s->bitrate,
                'max_listeners' => $s->max_listeners,
                'client_name' => $s->user->name ?? 'N/A',
                'created_at' => $s->created_at->format('d/m/Y'),
            ])->values()->toArray(),
        ]);
    }
}
