<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaylistSchedule extends Model
{
    protected $fillable = [
        'playlist_id',
        'name',
        'start_time',
        'end_time',
        'days_of_week', // JSON: [1,2,3,4,5]
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'days_of_week' => 'array',
            'priority' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }
}
