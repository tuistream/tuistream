<?php

namespace Modules\Streaming\Services;

use Illuminate\Support\Facades\Log;
use Modules\Streaming\Contracts\DockerRunner;

class MockDockerRunner implements DockerRunner
{
    public function isAvailable(): bool
    {
        return false;
    }

    public function up(string $workDir): array
    {
        Log::info('[MOCK DOCKER] docker compose up simulado en: ' . $workDir);
        return ['success' => true, 'output' => 'Modo MOCK: Docker Compose levantado simuladamente.'];
    }

    public function down(string $workDir): array
    {
        Log::info('[MOCK DOCKER] docker compose down simulado en: ' . $workDir);
        return ['success' => true, 'output' => 'Modo MOCK: Docker Compose detenido simuladamente.'];
    }
}
