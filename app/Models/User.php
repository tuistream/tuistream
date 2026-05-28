<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'api_access',
        'api_token',
        'send_welcome_email',
        'parent_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Relación con el revendedor padre (si aplica).
     */
    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    /**
     * Relación con los clientes creados (si es un revendedor).
     */
    public function children()
    {
        return $this->hasMany(User::class, 'parent_id');
    }

    /**
     * Relación con las estaciones de streaming del usuario.
     */
    public function stations()
    {
        return $this->hasMany(\Modules\Stations\Models\Station::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'send_welcome_email' => 'boolean',
        ];
    }

    public function generateApiToken(): string
    {
        $plainToken = 'tui_' . bin2hex(random_bytes(32));
        $this->api_token = hash('sha256', $plainToken);
        $this->save();

        return $plainToken;
    }

    public function revokeApiToken(): void
    {
        $this->api_token = null;
        $this->save();
    }
}
