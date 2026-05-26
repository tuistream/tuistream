<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Modules\Stations\Models\Station;
use Modules\Streaming\Services\StationOrchestrator;

class TestOrchestrator extends Command
{
    /**
     * El nombre y firma del comando.
     *
     * @var string
     */
    protected $signature = 'tuistream:test-orchestrator';

    /**
     * Descripción del comando.
     *
     * @var string
     */
    protected $description = 'Prueba el flujo de aprovisionamiento y orquestación de emisoras (Fase 3)';

    /**
     * Ejecutar el comando.
     */
    public function handle(StationOrchestrator $orchestrator)
    {
        $this->info('=== Iniciando Prueba del Orquestador de Streaming ===');

        // 1. Crear un usuario de prueba
        $this->comment('Creando usuario de prueba...');
        $user = User::firstOrCreate(
            ['email' => 'test@tuistream.com'],
            [
                'name' => 'Demo Admin',
                'password' => Hash::make('secret123'),
                'role' => 'super_admin'
            ]
        );
        $this->info("Usuario de prueba listo: {$user->name} ({$user->role})");

        // 2. Crear una estación de radio de prueba
        $this->comment('Creando emisora de radio de prueba...');
        $port = 8010;
        $slug = 'radio-fiesta';
        
        // Limpiar estación previa para pruebas limpias
        $existing = Station::where('slug', $slug)->first();
        if ($existing) {
            $orchestrator->delete($existing);
            $existing->delete();
        }

        $station = Station::create([
            'user_id' => $user->id,
            'name' => 'Radio Fiesta Latino',
            'slug' => $slug,
            'type' => 'audio',
            'backend' => 'liquidsoap',
            'frontend' => 'icecast',
            'port' => $port,
            'status' => 'offline',
            'is_active' => true,
            'max_listeners' => 250,
            'bitrate' => 192,
        ]);
        $this->info("Emisora de prueba registrada: {$station->name} (Puerto: {$station->port})");

        // 3. Ejecutar Setup
        $this->comment('Generando directorios y archivos de configuración...');
        $setupResult = $orchestrator->setup($station);
        if ($setupResult) {
            $this->info('✓ Directorios y archivos generados con éxito.');
            
            $stationPath = $orchestrator->getStationPath($station);
            $this->line("Ruta de la estación: <comment>{$stationPath}</comment>");

            // Mostrar archivos generados
            $this->line('Archivos creados:');
            $this->line('- docker-compose.yml: ' . (file_exists($stationPath . '/docker-compose.yml') ? '✓' : '✗'));
            $this->line('- config/liquidsoap.liq: ' . (file_exists($stationPath . '/config/liquidsoap.liq') ? '✓' : '✗'));
            $this->line('- config/icecast.xml: ' . (file_exists($stationPath . '/config/icecast.xml') ? '✓' : '✗'));
            $this->line('- config/fallback.mp3: ' . (file_exists($stationPath . '/config/fallback.mp3') ? '✓' : '✗'));
        } else {
            $this->error('✗ Error generando configuraciones.');
            return 1;
        }

        // 4. Ejecutar Start (Simulado en local)
        $this->comment('Encendiendo emisora de radio...');
        $startResult = $orchestrator->start($station);
        
        if ($startResult['success']) {
            $this->info("✓ Emisora iniciada con éxito. Estado en Base de Datos: {$station->fresh()->status}");
            $this->line("Salida: {$startResult['output']}");
        } else {
            $this->error("✗ Error al encender la emisora: {$startResult['output']}");
            return 1;
        }

        // 5. Ejecutar Stop
        $this->comment('Apagando emisora de radio...');
        $stopResult = $orchestrator->stop($station);
        if ($stopResult['success']) {
            $this->info("✓ Emisora apagada con éxito. Estado en Base de Datos: {$station->fresh()->status}");
        } else {
            $this->error("✗ Error al apagar la emisora: {$stopResult['output']}");
            return 1;
        }

        $this->info('=== Prueba completada exitosamente sin errores ===');
        return 0;
    }
}
