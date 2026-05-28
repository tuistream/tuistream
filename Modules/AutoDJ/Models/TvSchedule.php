<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;

class TvSchedule extends Model
{
    protected $fillable = ['station_id', 'video_media_id', 'position'];

    protected $casts = [
        'position' => 'integer',
    ];

    public function station()
    {
        return $this->belongsTo(\Modules\Stations\Models\Station::class);
    }

    public function videoMedia()
    {
        return $this->belongsTo(VideoMedia::class, 'video_media_id');
    }
}
