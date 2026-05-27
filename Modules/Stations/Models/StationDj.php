<?php

namespace Modules\Stations\Models;

use Illuminate\Database\Eloquent\Model;

class StationDj extends Model
{
    protected $table = 'station_djs';

    protected $fillable = [
        'station_id',
        'name',
        'username',
        'password',
        'is_active',
        'streams_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'streams_count' => 'integer',
    ];

    protected $hidden = [
        'password',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
