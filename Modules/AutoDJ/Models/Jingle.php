<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;

class Jingle extends Model
{
    protected $fillable = [
        'station_id',
        'name',
        'filename',
        'path',
        'duration',
        'interval',
        'is_active',
    ];

    protected $casts = [
        'duration' => 'integer',
        'interval' => 'integer',
        'is_active' => 'boolean',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
