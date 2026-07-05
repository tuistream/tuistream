<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    protected $fillable = [
        'filename',
        'original_name',
        'path',
        'type', // audio, video
        'format',
        'size',
        'duration',
        'bitrate',
        'sample_rate',
        'channels',
        'resolution',
        'codec',
        'metadata',
        'thumbnail_path',
        'folder_id',
        'client_id',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'duration' => 'float',
            'bitrate' => 'integer',
            'sample_rate' => 'integer',
            'channels' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function playlists()
    {
        return $this->belongsToMany(Playlist::class, 'playlist_media');
    }
}
