<?php

namespace Tests\Feature\ExternalApi;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function token_creation_endpoint_requires_admin()
    {
        $user = User::factory()->create();
        $user->assignRole('client');

        $response = $this->actingAs($user)
            ->postJson('/api/tokens', ['name' => 'test']);

        $response->assertForbidden();
    }

    /** @test */
    public function admin_can_create_api_token()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/tokens', [
                'name'      => 'Integration Token',
                'abilities' => ['read'],
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'name']);
    }

    /** @test */
    public function api_returns_429_when_rate_limited()
    {
        $user = User::factory()->create();
        $user->assignRole('client');
        $token = $user->createToken('test', ['read'])->plainTextToken;

        // Send 125 requests (limit is 120/min)
        for ($i = 0; $i < 125; $i++) {
            $response = $this->withToken($token)->getJson('/api/v1/me');
            if ($response->status() === 429) {
                $this->assertTrue(true);
                return;
            }
        }

        $this->assertTrue(false, 'Rate limit was never triggered');
    }

    /** @test */
    public function profile_endpoint_returns_user_data()
    {
        $user = User::factory()->create(['name' => 'Test Client']);
        $user->assignRole('client');
        $token = $user->createToken('test', ['read'])->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('data.name', 'Test Client')
            ->assertJsonPath('data.email', $user->email);
    }
}
