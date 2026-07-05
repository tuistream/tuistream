<?php

namespace Database\Factories;

use App\Models\TvChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TvChannelFactory extends Factory
{
    protected $model = TvChannel::class;

    public function definition(): array
    {
        $name = fake()->unique()->company() . ' TV';
        return [
            'name'              => $name,
            'slug'              => Str::slug($name),
            'description'       => fake()->sentence(),
            'client_id'         => User::factory(),
            'channel_type'      => fake()->randomElement(['tv_247', 'web_tv', 'visual_radio', 'live_event']),
            'is_active'         => true,
            'is_public'         => true,
            'stream_key'        => Str::random(32),
            'current_viewers'   => 0,
            'peak_viewers'      => 0,
            'resolution'        => '1920x1080',
            'bitrate'           => 4000,
            'auto_schedule_enabled' => false,
        ];
    }

    public function live(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active'       => true,
            'current_viewers' => fake()->numberBetween(10, 500),
        ]);
    }
}
