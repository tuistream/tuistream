<?php

namespace Tests\Feature\ExternalApi;

use App\Models\TvChannel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TvChannelApiTest extends TestCase
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
    public function client_can_list_own_tv_channels()
    {
        TvChannel::factory()->count(2)->create(['client_id' => $this->client->id]);
        TvChannel::factory()->create(['client_id' => User::factory()->create()->id]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/tv-channels');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function sensitive_stream_fields_are_not_exposed()
    {
        $channel = TvChannel::factory()->create(['client_id' => $this->client->id]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/tv-channels');

        $data = $response->json('data.0');
        $this->assertArrayNotHasKey('stream_key', $data);
        $this->assertArrayNotHasKey('source_password', $data);
    }

    /** @test */
    public function client_can_view_channel_viewers()
    {
        $channel = TvChannel::factory()->create([
            'client_id'       => $this->client->id,
            'current_viewers' => 150,
            'peak_viewers'    => 320,
        ]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/tv-channels/{$channel->id}/viewers");

        $response->assertOk()
            ->assertJsonPath('data.channel_id', $channel->id)
            ->assertJsonPath('data.current_viewers', 150);
    }

    /** @test */
    public function client_cannot_access_other_client_channel()
    {
        $otherChannel = TvChannel::factory()->create([
            'client_id' => User::factory()->create()->id,
        ]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/tv-channels/{$otherChannel->id}");

        $response->assertNotFound();
    }

    /** @test */
    public function channel_schedule_is_accessible()
    {
        $channel = TvChannel::factory()->create(['client_id' => $this->client->id]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/tv-channels/{$channel->id}/schedule");

        $response->assertOk()
            ->assertJsonStructure(['data']);
    }
}
