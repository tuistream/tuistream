<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'timezone',
        'is_active',
        'is_suspended',
        'suspended_at',
        'suspended_reason',
        'last_login_at',
        'last_login_ip',
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_suspended' => 'boolean',
            'suspended_at' => 'datetime',
            'last_login_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    public function stations(): HasMany
    {
        return $this->hasMany(Station::class, 'client_id');
    }

    public function channels(): HasMany
    {
        return $this->hasMany(TvChannel::class, 'client_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'client_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }
}
