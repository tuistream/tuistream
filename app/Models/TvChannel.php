<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TvChannel extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'slug',
        'description',
        'client_id',
        'channel_type', // tv_247, web_tv, visual_radio, live_event
        'is_active',
        'is_public',
        'rtmp_url',
        'hls_url',
        'dash_url',
        'stream_key',
        'current_viewers',
        'peak_viewers',
        'current_program',
        'resolution',
        'bitrate',
        'auto_schedule_enabled',
        'last_stream_started_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'auto_schedule_enabled' => 'boolean',
            'current_viewers' => 'integer',
            'peak_viewers' => 'integer',
            'bitrate' => 'integer',
            'last_stream_started_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(VideoSchedule::class);
    }

    public function viewerStats(): HasMany
    {
        return $this->hasMany(ViewerStat::class);
    }
}
