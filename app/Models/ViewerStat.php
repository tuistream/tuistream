<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViewerStat extends Model
{
    protected $fillable = [
        'tv_channel_id',
        'viewers',
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
            'viewers' => 'integer',
            'connected_at' => 'datetime',
            'disconnected_at' => 'datetime',
            'duration' => 'integer',
        ];
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(TvChannel::class, 'tv_channel_id');
    }
}
