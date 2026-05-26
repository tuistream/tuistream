<?php

namespace Modules\Stations\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Modules\AutoDJ\Models\Playlist;
use Modules\AutoDJ\Models\MediaFile;

class Station extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'type',
        'backend',
        'frontend',
        'port',
        'status',
        'is_active',
        'max_listeners',
        'bitrate',
        'storage_limit',
        'bandwidth_limit',
        'stream_key',
        'custom_domain',
        'server_node',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'port' => 'integer',
        'max_listeners' => 'integer',
        'bitrate' => 'integer',
        'storage_limit' => 'integer',
        'bandwidth_limit' => 'integer',
    ];

    /**
     * Relación con el propietario de la estación.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con las playlists de la estación.
     */
    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    /**
     * Relación con los archivos multimedia de la estación.
     */
    public function mediaFiles()
    {
        return $this->hasMany(MediaFile::class);
    }
}
