<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ServerStat;
use App\Models\Station;
use App\Models\TvChannel;

class CollectServerStats extends Command
{
    protected $signature = 'tuistream:collect-stats';
    protected $description = 'Collect real-time server statistics';

    public function handle(): void
    {
        $cpu = 0;
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            $cpu = min(100, max(0, round($load[0] * 100)));
        }

        $diskTotal = @disk_total_space(base_path()) ?: 1;
        $diskFree = @disk_free_space(base_path()) ?: 0;

        $ramTotal = 128 * 1024 * 1024;
        $limit = ini_get('memory_limit');
        if ($limit && $limit !== '-1') {
            $ramTotal = $this->iniToBytes($limit);
        }

        ServerStat::create([
            'cpu_usage' => $cpu,
            'ram_usage' => memory_get_usage(true),
            'ram_total' => $ramTotal,
            'disk_usage' => $diskTotal - $diskFree,
            'disk_total' => $diskTotal,
            'network_in' => 0,
            'network_out' => 0,
            'active_streams' => Station::where('is_active', true)->count(),
            'active_listeners' => Station::sum('current_listeners'),
            'active_viewers' => TvChannel::sum('current_viewers'),
            'recorded_at' => now(),
        ]);

        $this->info('Server stats collected: CPU=' . $cpu . '%, Disk=' . round((($diskTotal - $diskFree) / max($diskTotal, 1)) * 100) . '%');
    }

    private function iniToBytes(string $val): int
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val) - 1] ?? '');
        $num = (int) $val;
        return match ($last) { 'g' => $num * 1073741824, 'm' => $num * 1048576, 'k' => $num * 1024, default => max($num, 128 * 1048576) };
    }
}
