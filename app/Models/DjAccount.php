<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DjAccount extends Model
{
    protected $fillable = [
        'station_id',
        'username',
        'password',
        'display_name',
        'is_active',
        'max_stream_duration',
        'last_login_at',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'max_stream_duration' => 'integer',
            'last_login_at' => 'datetime',
        ];
    }

    public function station(): BelongsTo
    {
        return $this->belongsTo(Station::class);
    }
}
