<?php

namespace Modules\Stations\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Modules\AutoDJ\Models\Playlist;
use Modules\AutoDJ\Models\MediaFile;

class Station extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'publish_name',
        'admin_password',
        'slug',
        'type',
        'service_type',
        'backend',
        'frontend',
        'autodj_service',
        'autodj_enabled',
        'port',
        'status',
        'is_active',
        'max_listeners',
        'bitrate',
        'mountpoints',
        'autodj_sources',
        'transcoder_profiles',
        'stream_targets_limit',
        'stream_targets',
        'geoip_locking',
        'ndvr_rewind',
        'storage_limit',
        'bandwidth_limit',
        'disk_space_limit',
        'data_transfer_limit',
        'stream_key',
        'ftp_password',
        'custom_domain',
        'server_node',
    ];

    protected $casts = [
        'is_active'            => 'boolean',
        'geoip_locking'        => 'boolean',
        'ndvr_rewind'          => 'boolean',
        'transcoder_profiles' => 'array',
        'stream_targets'      => 'array',
        'port'                 => 'integer',
        'max_listeners'        => 'integer',
        'bitrate'              => 'integer',
        'mountpoints'          => 'integer',
        'autodj_sources'       => 'integer',
        'storage_limit'        => 'integer',
        'bandwidth_limit'      => 'integer',
        'disk_space_limit'     => 'integer',
        'data_transfer_limit'  => 'integer',
        'stream_targets_limit' => 'integer',
    ];

    protected $hidden = [
        'admin_password',
        'ftp_password',
    ];

    protected static function booted(): void
    {
        static::creating(function (Station $station) {
            if (empty($station->slug)) {
                $station->slug = Str::slug($station->name) . '-' . Str::random(4);
            }

            if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $station->slug)) {
                throw new \InvalidArgumentException("Slug inválido: '{$station->slug}'. Use formato [a-z0-9-] sin dobles guiones ni guiones al inicio/fin.");
            }
        });

        static::updating(function (Station $station) {
            if ($station->isDirty('slug') && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $station->slug)) {
                throw new \InvalidArgumentException("Slug inválido: '{$station->slug}'. Use formato [a-z0-9-] sin dobles guiones ni guiones al inicio/fin.");
            }
        });
    }

    /**
     * Relación con el propietario de la estación.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con las playlists de la estación.
     */
    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    /**
     * Relación con los archivos multimedia de la estación.
     */
    public function mediaFiles()
    {
        return $this->hasMany(MediaFile::class);
    }

    public function jingles()
    {
        return $this->hasMany(\Modules\AutoDJ\Models\Jingle::class);
    }

    public function scheduleSlots()
    {
        return $this->hasMany(\Modules\AutoDJ\Models\ScheduleSlot::class);
    }

    public function mountPoints()
    {
        return $this->hasMany(\Modules\AutoDJ\Models\MountPoint::class);
    }
}
