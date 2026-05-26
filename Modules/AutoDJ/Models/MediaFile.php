<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Stations\Models\Station;

class MediaFile extends Model
{
    protected $fillable = [
        'station_id',
        'filename',
        'filepath',
        'title',
        'artist',
        'duration',
        'size',
    ];

    protected $casts = [
        'duration' => 'float',
        'size' => 'integer',
    ];

    /**
     * Relación con la estación propietaria del archivo multimedia.
     */
    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    /**
     * Relación de muchos a muchos con las playlists.
     */
    public function playlists()
    {
        return $this->belongsToMany(Playlist::class, 'playlist_media')
            ->withPivot('weight')
            ->withTimestamps();
    }
}
