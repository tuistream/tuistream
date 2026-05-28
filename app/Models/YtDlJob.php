<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class YtDlJob extends Model
{
    protected $table = 'yt_dl_jobs';

    protected $fillable = [
        'job_id',
        'station_id',
        'station_name',
        'url',
        'title',
        'format',
        'quality',
        'playlist',
        'status',
        'progress',
        'error',
    ];

    public function station()
    {
        return $this->belongsTo(\Modules\Stations\Models\Station::class, 'station_id');
    }
}
