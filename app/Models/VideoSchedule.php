<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoSchedule extends Model
{
    protected $fillable = [
        'tv_channel_id',
        'media_id',
        'title',
        'start_time',
        'end_time',
        'days_of_week',
        'repeat_until',
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'repeat_until' => 'datetime',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function channel(): BelongsTo
    {
        return $this->belongsTo(TvChannel::class, 'tv_channel_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
