<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerStat extends Model
{
    protected $fillable = [
        'cpu_usage',
        'ram_usage',
        'ram_total',
        'disk_usage',
        'disk_total',
        'network_in',
        'network_out',
        'active_streams',
        'active_listeners',
        'active_viewers',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'cpu_usage' => 'float',
            'ram_usage' => 'integer',
            'ram_total' => 'integer',
            'disk_usage' => 'integer',
            'disk_total' => 'integer',
            'network_in' => 'integer',
            'network_out' => 'integer',
            'active_streams' => 'integer',
            'active_listeners' => 'integer',
            'active_viewers' => 'integer',
            'recorded_at' => 'datetime',
        ];
    }
}
