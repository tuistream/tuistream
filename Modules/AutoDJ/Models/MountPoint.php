<?php

namespace Modules\AutoDJ\Models;

use Illuminate\Database\Eloquent\Model;

class MountPoint extends Model
{
    protected $table = 'mount_points';

    protected $fillable = [
        'station_id',
        'path',
        'bitrate',
        'format',
        'is_default',
        'is_public',
    ];

    protected $casts = [
        'bitrate' => 'integer',
        'is_default' => 'boolean',
        'is_public' => 'boolean',
    ];

    public function station()
    {
        return $this->belongsTo(\Modules\Stations\Models\Station::class);
    }
}
