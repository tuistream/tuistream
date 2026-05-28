<?php

namespace Modules\Streaming\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Modules\Streaming\Contracts\DockerRunner;

class RealDockerRunner implements DockerRunner
{
    public function isAvailable(): bool
    {
        if (file_exists('/.dockerenv')) {
            return false;
        }

        if (PHP_OS_FAMILY === 'Windows') {
            return false;
        }

        $result = Process::run('docker compose version', function () {})->successful()
            || Process::run('docker-compose --version', function () {})->successful();

        if (!$result) {
            Log::warning('Docker no disponible en el sistema.');
        }

        return $result;
    }

    public function up(string $workDir): array
    {
        if (!is_dir($workDir) || !file_exists($workDir . '/docker-compose.yml')) {
            return ['success' => false, 'output' => 'docker-compose.yml no encontrado en ' . $workDir];
        }

        $result = Process::path($workDir)->run('docker compose up -d');

        return [
            'success' => $result->successful(),
            'output' => $result->successful() ? $result->output() : $result->errorOutput(),
        ];
    }

    public function down(string $workDir): array
    {
        if (!is_dir($workDir) || !file_exists($workDir . '/docker-compose.yml')) {
            return ['success' => true, 'output' => 'No requiere detención: archivos de configuración no existen.'];
        }

        $result = Process::path($workDir)->run('docker compose down');

        return [
            'success' => $result->successful(),
            'output' => $result->successful() ? $result->output() : $result->errorOutput(),
        ];
    }
}
