<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Stations\Models\Station;

class Playlist extends Model
{
    protected $fillable = [
        'station_id',
        'name',
        'type',
        'is_active',
        'play_mode',
        'schedule_start',
        'schedule_end',
        'weight',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'weight' => 'integer',
    ];

    /**
     * Relación con la estación propietaria de la playlist.
     */
    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    /**
     * Relación de muchos a muchos con los archivos multimedia.
     */
    public function mediaFiles()
    {
        return $this->belongsToMany(MediaFile::class, 'playlist_media')
            ->withPivot('weight')
            ->withTimestamps();
    }
}
