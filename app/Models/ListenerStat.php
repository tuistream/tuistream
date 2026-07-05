<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListenerStat extends Model
{
    protected $fillable = [
        'station_id',
        'listeners',
        'country',
        'city',
        'user_agent',
        'ip_address',
        'connected_at',
        'disconnected_at',
        'duration',
    ];

    protected function casts(): array
    {
        return [
            'listeners' => 'integer',
            'connected_at' => 'datetime',
            'disconnected_at' => 'datetime',
            'duration' => 'integer',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }
}
