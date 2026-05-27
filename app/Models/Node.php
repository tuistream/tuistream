<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Node extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ip',
        'type',
        'region',
        'country_codes',
        'status',
        'cpu_usage',
        'ram_usage',
        'bandwidth_mbps',
        'max_stations',
        'latency_ms',
        'uptime_pct',
        'api_token',
    ];

    protected $casts = [
        'country_codes' => 'array',
        'cpu_usage' => 'integer',
        'ram_usage' => 'integer',
        'bandwidth_mbps' => 'integer',
        'max_stations' => 'integer',
        'latency_ms' => 'integer',
        'uptime_pct' => 'integer',
    ];
}
