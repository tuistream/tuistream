<?php

namespace App\Console;

use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Console\Scheduling\Schedule;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Collect server stats every minute
        $schedule->command('tuistream:collect-stats')->everyMinute();

        // Clean old listener/viewer stats (keep 30 days)
        $schedule->command('model:prune', [
            '--model' => [
                \App\Models\ListenerStat::class,
                \App\Models\ViewerStat::class,
            ],
        ])->daily();

        // Clean old audit logs (keep 90 days)
        $schedule->command('model:prune', [
            '--model' => [\App\Models\AuditLog::class],
        ])->daily();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
