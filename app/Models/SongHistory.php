<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SongHistory extends Model
{
    protected $fillable = [
        'station_id',
        'title',
        'artist',
        'album',
        'duration',
        'media_id',
        'dj_id',
        'source', // autodj, live_dj, playlist
        'played_at',
        'listeners_at_time',
    ];

    protected function casts(): array
    {
        return [
            'duration' => 'float',
            'played_at' => 'datetime',
            'listeners_at_time' => 'integer',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    public function dj(): BelongsTo
    {
        return $this->belongsTo(DjAccount::class, 'dj_id');
    }
}
