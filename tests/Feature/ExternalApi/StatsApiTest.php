<?php

namespace Tests\Feature\ExternalApi;

use App\Models\Station;
use App\Models\TvChannel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = User::factory()->create(['is_active' => true]);
        $this->client->assignRole('client');
        $this->token = $this->client->createToken('test-token', ['read'])->plainTextToken;
    }

    /** @test */
    public function stats_summary_returns_correct_structure()
    {
        Station::factory()->count(2)->create([
            'client_id'        => $this->client->id,
            'is_active'        => true,
            'current_listeners' => 10,
        ]);
        TvChannel::factory()->create([
            'client_id'       => $this->client->id,
            'is_active'       => true,
            'current_viewers' => 20,
        ]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/stats/summary');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'stations',
                    'tv_channels',
                    'media',
                    'generated_at',
                ],
            ])
            ->assertJsonPath('data.stations.total', 2)
            ->assertJsonPath('data.tv_channels.total', 1);
    }

    /** @test */
    public function stats_only_reflect_own_resources()
    {
        Station::factory()->create([
            'client_id'        => $this->client->id,
            'current_listeners' => 5,
        ]);
        Station::factory()->create([
            'client_id'        => User::factory()->create()->id,
            'current_listeners' => 100,
        ]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/stats/summary');

        $response->assertJsonPath('data.stations.total', 1);
    }
}
