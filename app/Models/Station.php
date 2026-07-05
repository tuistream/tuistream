<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Station extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'slug',
        'description',
        'genre',
        'website_url',
        'client_id',
        'is_active',
        'is_public',
        'stream_url',
        'stream_ssl_url',
        'source_password',
        'admin_password',
        'max_listeners',
        'bitrate',
        'audio_format',
        'auto_dj_enabled',
        'auto_dj_status',
        'current_song',
        'current_listeners',
        'peak_listeners',
        'total_listening_time',
        'last_stream_started_at',
        'mount_point',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_public' => 'boolean',
            'auto_dj_enabled' => 'boolean',
            'max_listeners' => 'integer',
            'bitrate' => 'integer',
            'current_listeners' => 'integer',
            'peak_listeners' => 'integer',
            'total_listening_time' => 'integer',
            'last_stream_started_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function playlists(): HasMany
    {
        return $this->hasMany(Playlist::class);
    }

    public function djAccounts(): HasMany
    {
        return $this->hasMany(DjAccount::class);
    }

    public function listenerStats(): HasMany
    {
        return $this->hasMany(ListenerStat::class);
    }

    public function songHistory(): HasMany
    {
        return $this->hasMany(SongHistory::class);
    }
}
