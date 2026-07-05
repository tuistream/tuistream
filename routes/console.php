<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled command for server stats collection
Artisan::command('tuistream:collect-stats', function () {
    $this->comment('Collecting server statistics...');
    // This will be implemented with actual system metrics collection
})->purpose('Collect server statistics for monitoring');
