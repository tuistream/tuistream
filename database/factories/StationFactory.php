<?php

namespace Database\Factories;

use App\Models\Station;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class StationFactory extends Factory
{
    protected $model = Station::class;

    public function definition(): array
    {
        $name = fake()->unique()->company() . ' Radio';
        return [
            'name'               => $name,
            'slug'               => Str::slug($name),
            'description'        => fake()->sentence(),
            'genre'              => fake()->randomElement(['Pop', 'Rock', 'Jazz', 'Electronic', 'Classical', 'Hip Hop']),
            'client_id'          => User::factory(),
            'is_active'          => true,
            'is_public'          => true,
            'source_password'    => Str::random(16),
            'admin_password'     => Str::random(16),
            'max_listeners'      => fake()->numberBetween(50, 500),
            'bitrate'            => fake()->randomElement([64, 96, 128, 192, 256, 320]),
            'audio_format'       => 'mp3',
            'auto_dj_enabled'    => false,
            'auto_dj_status'     => 'stopped',
            'current_listeners'  => 0,
            'peak_listeners'     => 0,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active'     => true,
            'auto_dj_enabled' => true,
            'auto_dj_status'  => 'running',
        ]);
    }
}
