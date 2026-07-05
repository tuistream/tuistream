<?php

namespace Tests\Feature\ExternalApi;

use App\Models\Station;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StationApiTest extends TestCase
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
    public function health_endpoint_returns_ok_without_auth()
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonStructure(['status', 'app', 'version', 'timezone', 'timestamp']);
    }

    /** @test */
    public function authenticated_user_can_list_own_stations()
    {
        Station::factory()->count(3)->create(['client_id' => $this->client->id]);
        // Station owned by another client (should not be visible)
        Station::factory()->create(['client_id' => User::factory()->create()->id]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/stations');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function unauthenticated_requests_are_rejected()
    {
        $response = $this->getJson('/api/v1/stations');

        $response->assertUnauthorized();
    }

    /** @test */
    public function client_cannot_access_other_client_station()
    {
        $otherUser = User::factory()->create();
        $otherStation = Station::factory()->create(['client_id' => $otherUser->id]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/stations/{$otherStation->id}");

        $response->assertNotFound();
    }

    /** @test */
    public function client_can_view_own_station_detail()
    {
        $station = Station::factory()->create(['client_id' => $this->client->id]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/stations/{$station->id}");

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'name', 'playlists']]);
    }

    /** @test */
    public function sensitive_fields_are_not_exposed()
    {
        $station = Station::factory()->create(['client_id' => $this->client->id]);

        $response = $this->withToken($this->token)
            ->getJson('/api/v1/stations');

        $data = $response->json('data.0');
        $this->assertArrayNotHasKey('source_password', $data);
        $this->assertArrayNotHasKey('admin_password', $data);
    }

    /** @test */
    public function listeners_endpoint_returns_correct_structure()
    {
        $station = Station::factory()->create([
            'client_id'        => $this->client->id,
            'current_listeners' => 42,
            'peak_listeners'    => 85,
            'is_active'         => true,
        ]);

        $response = $this->withToken($this->token)
            ->getJson("/api/v1/stations/{$station->id}/listeners");

        $response->assertOk()
            ->assertJsonPath('data.station_id', $station->id)
            ->assertJsonPath('data.current_listeners', 42)
            ->assertJsonPath('data.peak_listeners', 85);
    }
}
