<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Playlist extends Model
{
    protected $fillable = [
        'name',
        'description',
        'station_id',
        'is_active',
        'is_jingle_playlist',
        'playback_order', // sequential, random, weighted
        'crossfade_duration',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_jingle_playlist' => 'boolean',
            'crossfade_duration' => 'integer',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'playlist_media')
            ->withPivot(['order', 'weight', 'cue_in', 'cue_out'])
            ->withTimestamps()
            ->orderBy('order');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(PlaylistSchedule::class);
    }
}
