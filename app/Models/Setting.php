<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
    ];

    protected $casts = [
        'value' => 'string',
    ];

    private static ?array $loadedSettings = null;

    public static function get(string $key, mixed $default = null): mixed
    {
        self::loadAll();

        if (isset(self::$loadedSettings[$key])) {
            $entry = self::$loadedSettings[$key];

            return match ($entry['type']) {
                'json' => json_decode($entry['value'], true),
                'boolean' => (bool) $entry['value'],
                'integer' => (int) $entry['value'],
                default => $entry['value'],
            };
        }

        return $default;
    }

    public static function set(string $key, mixed $value, string $type = 'string', string $group = 'general'): void
    {
        if (is_array($value)) {
            $type = 'json';
            $value = json_encode($value);
        } elseif (is_bool($value)) {
            $type = 'boolean';
            $value = $value ? '1' : '0';
        } elseif (is_int($value)) {
            $type = 'integer';
            $value = (string) $value;
        }

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type, 'group' => $group]
        );

        self::$loadedSettings = null;
        Cache::forget('settings:all');
    }

    private static function loadAll(): void
    {
        if (self::$loadedSettings !== null) {
            return;
        }

        self::$loadedSettings = Cache::rememberForever('settings:all', function () {
            $map = [];
            foreach (static::select('key', 'value', 'type')->get() as $row) {
                $map[$row->key] = [
                    'value' => $row->value,
                    'type' => $row->type,
                ];
            }
            return $map;
        });
    }
}
