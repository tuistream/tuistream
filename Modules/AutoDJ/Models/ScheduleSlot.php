<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduleSlot extends Model
{
    protected $table = 'schedule_slots';

    protected $fillable = [
        'station_id',
        'day',
        'start_time',
        'end_time',
        'type',
        'playlist_id',
        'title',
    ];

    protected $casts = [
        'day' => 'integer',
        'playlist_id' => 'integer',
    ];

    public function station()
    {
        return $this->belongsTo(\Modules\Stations\Models\Station::class);
    }

    public function playlist()
    {
        return $this->belongsTo(Playlist::class);
    }
}
