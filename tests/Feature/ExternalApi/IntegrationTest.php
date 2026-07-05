<?php

namespace Tests\Feature\ExternalApi;

use App\Models\Station;
use App\Models\TvChannel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pruebas de integración end-to-end: flujo completo de interacción
 * entre sistema externo y TuiStream.
 */
class IntegrationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function full_external_system_workflow()
    {
        // 1. Admin crea un token para el sistema externo
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $tokenResponse = $this->actingAs($admin)
            ->postJson('/api/tokens', [
                'name'      => 'Sistema Externo Monitoreo',
                'abilities' => ['read', 'sync'],
            ]);
        $tokenResponse->assertCreated();
        $apiToken = $tokenResponse->json('token');

        // 2. Sistema externo hace health check
        $this->getJson('/api/v1/health')->assertOk();

        // 3. Sistema externo autentica con el token
        $meResponse = $this->withToken($apiToken)
            ->getJson('/api/v1/me');
        $meResponse->assertOk();

        // 4. Sistema externo consulta estaciones del cliente
        $clientId = $meResponse->json('data.id');
        Station::factory()->create([
            'client_id'        => $clientId,
            'name'             => 'Radio Externa',
            'current_listeners' => 33,
            'is_active'        => true,
        ]);
        $stationsResponse = $this->withToken($apiToken)->getJson('/api/v1/stations');
        $stationsResponse->assertOk()
            ->assertJsonCount(1, 'data');

        // 5. Sistema externo consulta oyentes en tiempo real
        $stationId = $stationsResponse->json('data.0.id');
        $this->withToken($apiToken)
            ->getJson("/api/v1/stations/{$stationId}/listeners")
            ->assertOk()
            ->assertJsonPath('data.current_listeners', 33);

        // 6. Sistema externo consulta estadísticas globales
        $this->withToken($apiToken)
            ->getJson('/api/v1/stats/summary')
            ->assertOk();

        // 7. Sistema externo envía evento de sincronización
        $syncResponse = $this->withToken($apiToken)
            ->postJson('/api/v1/sync/events', [
                'event'   => 'media.processing.complete',
                'payload' => ['file_id' => 42, 'status' => 'ready'],
            ]);
        $syncResponse->assertCreated()
            ->assertJsonPath('event', 'media.processing.complete');

        // 8. Verificar que el evento fue registrado en auditoría
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $clientId,
            'action'  => 'external_api.event.media.processing.complete',
        ]);
    }

    /** @test */
    public function cross_client_data_isolation()
    {
        $clientA = User::factory()->create();
        $clientA->assignRole('client');
        $tokenA = $clientA->createToken('a', ['read'])->plainTextToken;

        $clientB = User::factory()->create();
        $clientB->assignRole('client');
        $tokenB = $clientB->createToken('b', ['read'])->plainTextToken;

        Station::factory()->create(['client_id' => $clientA->id, 'name' => 'Radio A']);
        Station::factory()->create(['client_id' => $clientB->id, 'name' => 'Radio B']);

        // Cliente A solo ve su estación
        $this->withToken($tokenA)->getJson('/api/v1/stations')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Radio A');

        // Cliente B solo ve su estación
        $this->withToken($tokenB)->getJson('/api/v1/stations')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Radio B');
    }

    /** @test */
    public function invalid_token_is_rejected()
    {
        $response = $this->withToken('invalid-token-123')
            ->getJson('/api/v1/stations');

        $response->assertUnauthorized();
    }
}
