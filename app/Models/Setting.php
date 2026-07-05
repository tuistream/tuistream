<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group', 'label'];

    protected function casts(): array
    {
        return [
            'value' => 'string',
        ];
    }

    public static function getValue(string $key, $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;

        return match ($setting->type) {
            'integer' => (int) $setting->value,
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    public static function setValue(string $key, mixed $value): void
    {
        // Use updateOrInsert to create the setting if it doesn't exist
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => (string) $value,
                'type' => 'string',
                'group' => 'general',
                'label' => $key,
            ]
        );
    }
}
