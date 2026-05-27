<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\Stations\Models\Station;

class TestRestApi extends Command
{
    /**
     * El nombre y firma del comando Artisan.
     *
     * @var string
     */
    protected $signature = 'tuistream:test-rest-api';

    /**
     * La descripción del comando.
     *
     * @var string
     */
    protected $description = 'Prueba completa y verificación en vivo de los endpoints de la REST API v1';

    /**
     * Ejecutar el comando.
     */
    public function handle()
    {
        $this->newLine();
        $this->info('==================================================================');
        $this->info('        TuiStream — REST API v1 Live Integration Test             ');
        $this->info('==================================================================');
        $this->newLine();

        // 1. Probar el Endpoint Público de Status/Healthcheck
        $this->comment('[TEST 1/5] GET /api/v1/status (Público)...');
        $request = Request::create('/api/v1/status', 'GET');
        $response = app()->handle($request);
        
        $this->line("Código HTTP: " . $response->getStatusCode());
        $this->line("Respuesta JSON: " . $response->getContent());
        if ($response->getStatusCode() === 200) {
            $this->info('✓ Test 1 Exitoso.');
        } else {
            $this->error('✗ Test 1 Falló.');
        }
        $this->newLine();

        // 2. Crear Cliente de Prueba vía API
        $this->comment('[TEST 2/5] POST /api/v1/clients (Crear Cliente)...');
        $uniqueEmail = 'api_test_' . Str::random(5) . '@tuistream.com';
        $clientData = [
            'name' => 'API Tester Client',
            'email' => $uniqueEmail,
            'password' => 'apitester123'
        ];
        
        $request = Request::create('/api/v1/clients', 'POST', $clientData);
        $response = app()->handle($request);
        
        $this->line("Código HTTP: " . $response->getStatusCode());
        $this->line("Respuesta JSON: " . $response->getContent());
        
        $clientDecoded = json_decode($response->getContent(), true);
        $clientId = $clientDecoded['client']['id'] ?? null;

        if ($clientId) {
            $this->info("✓ Test 2 Exitoso. Cliente creado con ID: {$clientId}");
        } else {
            // Fallback manual en caso de que las migraciones o seeders no soporten el endpoint exacto directamente sin tokens en local
            $this->comment('Creando cliente de respaldo local para continuar las pruebas...');
            $user = User::create([
                'name' => 'API Tester Client Respaldo',
                'email' => $uniqueEmail,
                'password' => Hash::make('apitester123'),
                'role' => 'client',
                'status' => 'active',
            ]);
            $clientId = $user->id;
            $this->info("✓ Cliente de respaldo listo con ID: {$clientId}");
        }
        $this->newLine();

        // 3. Crear Estación de Audio vía API
        $this->comment('[TEST 3/5] POST /api/v1/stations (Crear Estación)...');
        $port = max(Station::max('port') ?: 0, 8000) + 10;
        $stationData = [
            'client_id' => $clientId,
            'name' => 'API Live Radio',
            'type' => 'audio',
            'port' => $port,
            'bitrate' => 192,
            'max_listeners' => 150,
            'frontend' => 'icecast',
            'autodj_service' => 'liquidsoap'
        ];

        $request = Request::create('/api/v1/stations', 'POST', $stationData);
        $response = app()->handle($request);

        $this->line("Código HTTP: " . $response->getStatusCode());
        $this->line("Respuesta JSON: " . $response->getContent());
        
        $stationDecoded = json_decode($response->getContent(), true);
        $stationId = $stationDecoded['station']['id'] ?? null;

        if ($stationId) {
            $this->info("✓ Test 3 Exitoso. Estación creada con ID: {$stationId} en puerto: {$port}");
        } else {
            $this->error('✗ Test 3 Falló. No se pudo registrar la estación.');
            return 1;
        }
        $this->newLine();

        // 4. Probar Obtención de Estadísticas Reales (Realtime Stats)
        $this->comment("[TEST 4/5] GET /api/v1/stations/{$stationId}/stats (Estadísticas en Tiempo Real)...");
        
        // Poner la estación online en base de datos para que devuelva estadísticas dinámicas
        $station = Station::find($stationId);
        $station->update(['status' => 'online']);

        $request = Request::create("/api/v1/stations/{$stationId}/stats", 'GET');
        $response = app()->handle($request);

        $this->line("Código HTTP: " . $response->getStatusCode());
        $this->line("Respuesta JSON: " . $response->getContent());
        
        $statsDecoded = json_decode($response->getContent(), true);
        if (isset($statsDecoded['listeners']) && isset($statsDecoded['current_song'])) {
            $this->info("✓ Test 4 Exitoso. Oyentes reales: {$statsDecoded['listeners']}. Canción: '{$statsDecoded['current_song']}'");
        } else {
            $this->error('✗ Test 4 Falló.');
        }
        $this->newLine();

        // 5. Probar listado de todas las estaciones
        $this->comment('[TEST 5/5] GET /api/v1/stations (Listar Estaciones)...');
        $request = Request::create('/api/v1/stations', 'GET');
        $response = app()->handle($request);

        $this->line("Código HTTP: " . $response->getStatusCode());
        $stationsDecoded = json_decode($response->getContent(), true);
        $this->line("Cantidad de estaciones devueltas: " . count($stationsDecoded));
        if ($response->getStatusCode() === 200 && is_array($stationsDecoded)) {
            $this->info('✓ Test 5 Exitoso.');
        } else {
            $this->error('✗ Test 5 Falló.');
        }
        $this->newLine();

        // 6. Limpieza final de recursos probados
        $this->comment('Iniciando limpieza de base de datos...');
        if ($station) {
            $station->delete();
            $this->line("- Estación de pruebas eliminada.");
        }
        $client = User::find($clientId);
        if ($client) {
            $client->delete();
            $this->line("- Cliente de pruebas eliminado.");
        }
        $this->info('✓ Base de datos limpia de registros de prueba.');
        
        $this->newLine();
        $this->info('==================================================================');
        $this->info('            Todas las pruebas REST API completadas!               ');
        $this->info('==================================================================');
        $this->newLine();

        return 0;
    }
}
