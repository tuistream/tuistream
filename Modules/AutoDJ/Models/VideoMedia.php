<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;

class VideoMedia extends Model
{
    protected $fillable = [
        'station_id', 'title', 'filename', 'path',
        'duration', 'size_bytes', 'source', 'yt_url',
    ];

    protected $casts = [
        'duration' => 'integer',
        'size_bytes' => 'integer',
    ];

    public function station()
    {
        return $this->belongsTo(\Modules\Stations\Models\Station::class);
    }

    public function tvSchedules()
    {
        return $this->hasMany(TvSchedule::class, 'video_media_id');
    }
}
