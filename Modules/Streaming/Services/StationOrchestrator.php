<?php

namespace Modules\Streaming\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Modules\Stations\Models\Station;
use Modules\AutoDJ\Services\LiquidsoapConfigGenerator;

class StationOrchestrator
{
    protected $liquidsoapGenerator;
    protected $icecastGenerator;
    protected $rtmpGenerator;
    protected $composeGenerator;
    protected $baseStationsPath;

    public function __construct(
        LiquidsoapConfigGenerator $liquidsoapGenerator,
        IcecastConfigGenerator $icecastGenerator,
        NginxRtmpConfigGenerator $rtmpGenerator,
        DockerComposeGenerator $composeGenerator
    ) {
        $this->liquidsoapGenerator = $liquidsoapGenerator;
        $this->icecastGenerator = $icecastGenerator;
        $this->rtmpGenerator = $rtmpGenerator;
        $this->composeGenerator = $composeGenerator;
        
        // Carpeta base de almacenamiento de estaciones
        $this->baseStationsPath = (PHP_OS_FAMILY === 'Windows' || config('app.env') === 'local') 
            ? storage_path('tuistream/stations') 
            : '/var/tuistream/stations';
    }

    /**
     * Obtener la ruta absoluta a la carpeta de una emisora.
     */
    public function getStationPath(Station $station): string
    {
        return $this->baseStationsPath . DIRECTORY_SEPARATOR . $station->slug;
    }

    /**
     * Inicializar y crear toda la estructura de directorios y configuraciones de una emisora.
     */
    public function setup(Station $station): bool
    {
        $stationDir = $this->getStationPath($station);
        
        try {
            // APROVISIONAMIENTO PARA VIDEO (Nginx RTMP + HLS)
            if ($station->type === 'video') {
                File::ensureDirectoryExists($stationDir . '/config');
                File::ensureDirectoryExists($stationDir . '/hls');
                File::ensureDirectoryExists($stationDir . '/logs/nginx');

                $nginxConfig = $this->rtmpGenerator->generate($station, 'live');
                $dockerCompose = $this->composeGenerator->generate($station);

                File::put($stationDir . '/config/nginx.conf', $nginxConfig);
                File::put($stationDir . '/docker-compose.yml', $dockerCompose);

                Log::info("Estructura de VIDEO de la emisora {$station->slug} configurada en: {$stationDir}");
                return true;
            }

            // APROVISIONAMIENTO PARA AUDIO (Icecast / SHOUTcast + Liquidsoap)
            File::ensureDirectoryExists($stationDir . '/media');
            File::ensureDirectoryExists($stationDir . '/config');
            File::ensureDirectoryExists($stationDir . '/logs/liquidsoap');

            $sourcePassword = 'source_pass_' . bin2hex(random_bytes(4));
            $adminPassword = 'admin_pass_' . bin2hex(random_bytes(4));
            $djPassword = 'dj_pass_' . bin2hex(random_bytes(4));

            // Si es SHOUTcast
            if ($station->frontend === 'shoutcast') {
                File::ensureDirectoryExists($stationDir . '/logs/shoutcast');

                // Liquidsoap se conecta al contenedor de shoutcast
                $liquidsoapConfig = $this->liquidsoapGenerator->generate($station, $sourcePassword, $djPassword, 'shoutcast');
                
                $shoutcastConfig = <<<CONF
password={$sourcePassword}
adminpassword={$adminPassword}
portbase=8000
maxuser={$station->max_listeners}
logfile=/opt/shoutcast/logs/sc_serv.log
CONF;
                File::put($stationDir . '/config/sc_serv.conf', $shoutcastConfig);
            } else {
                // Si es Icecast
                File::ensureDirectoryExists($stationDir . '/logs/icecast');
                $liquidsoapConfig = $this->liquidsoapGenerator->generate($station, $sourcePassword, $djPassword, 'icecast');
                $icecastConfig = $this->icecastGenerator->generate($station, $sourcePassword, $adminPassword, $sourcePassword);
                File::put($stationDir . '/config/icecast.xml', $icecastConfig);
            }

            $dockerCompose = $this->composeGenerator->generate($station);

            File::put($stationDir . '/config/liquidsoap.liq', $liquidsoapConfig);
            File::put($stationDir . '/docker-compose.yml', $dockerCompose);

            // Audio de emergencia
            if (!File::exists($stationDir . '/config/fallback.mp3')) {
                File::put($stationDir . '/config/fallback.mp3', base64_decode('SUQzAwAAAAAAJVRYWFgAAAAIAAAAdGl0bGUAc2lsZW5jZQC/4EBAAAAAAAAAAAAAAAAAAAAA'));
            }

            Log::info("Estructura de AUDIO ({$station->frontend}) de la emisora {$station->slug} configurada en: {$stationDir}");
            return true;
        } catch (\Exception $e) {
            Log::error("Error configurando la emisora {$station->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Encender la emisora de radio levantando los contenedores Docker.
     */
    public function start(Station $station): array
    {
        $stationDir = $this->getStationPath($station);
        
        if (!File::exists($stationDir . '/docker-compose.yml')) {
            $this->setup($station);
        }

        // Si estamos en un entorno simulado
        if ($this->shouldMockDocker()) {
            $station->update(['status' => 'online']);
            Log::info("[MOCK DOCKER] Emisora {$station->slug} ({$station->type}) iniciada en modo simulado.");
            return ['success' => true, 'output' => 'Mode MOCK: Docker Compose levantado simuladamente.'];
        }

        // Comando para levantar contenedores
        $result = Process::path($stationDir)
            ->run('docker compose up -d');

        if ($result->successful()) {
            $station->update(['status' => 'online']);
            Log::info("Emisora {$station->slug} iniciada con éxito via Docker Compose.");
            return ['success' => true, 'output' => $result->output()];
        }

        $station->update(['status' => 'error']);
        Log::error("Fallo al iniciar la emisora {$station->slug}: " . $result->errorOutput());
        return ['success' => false, 'output' => $result->errorOutput()];
    }

    /**
     * Apagar la emisora destruyendo los contenedores Docker.
     */
    public function stop(Station $station): array
    {
        $stationDir = $this->getStationPath($station);

        if ($this->shouldMockDocker()) {
            $station->update(['status' => 'offline']);
            Log::info("[MOCK DOCKER] Emisora {$station->slug} detenida en modo simulado.");
            return ['success' => true, 'output' => 'Mode MOCK: Docker Compose detenido simuladamente.'];
        }

        if (!File::exists($stationDir . '/docker-compose.yml')) {
            return ['success' => true, 'output' => 'No requiere detención: archivos de configuración no existen.'];
        }

        $result = Process::path($stationDir)
            ->run('docker compose down');

        if ($result->successful()) {
            $station->update(['status' => 'offline']);
            Log::info("Emisora {$station->slug} detenida con éxito.");
            return ['success' => true, 'output' => $result->output()];
        }

        Log::error("Fallo al detener la emisora {$station->slug}: " . $result->errorOutput());
        return ['success' => false, 'output' => $result->errorOutput()];
    }

    /**
     * Reiniciar los servicios de la emisora.
     */
    public function restart(Station $station): array
    {
        $this->stop($station);
        return $this->start($station);
    }

    /**
     * Eliminar físicamente los archivos y contenedores de la emisora.
     */
    public function delete(Station $station): bool
    {
        $stationDir = $this->getStationPath($station);
        
        $this->stop($station);

        try {
            if (File::exists($stationDir)) {
                File::deleteDirectory($stationDir);
            }
            Log::info("Archivos físicos de la emisora {$station->slug} eliminados.");
            return true;
        } catch (\Exception $e) {
            Log::error("Fallo al eliminar archivos de la emisora {$station->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Método defensivo para saber si debemos simular Docker
     */
    protected function shouldMockDocker(): bool
    {
        // Si estamos dentro de un contenedor Docker, simular
        if (file_exists('/.dockerenv')) {
            return true;
        }
        // En Windows (desarrollo local)
        if (PHP_OS_FAMILY === 'Windows') {
            return true;
        }
        return false;
    }

    /**
     * Obtener estadísticas reales (oyentes y canción actual) consultando los servicios locales.
     */
    public function getRealStats(Station $station): array
    {
        $listeners = 0;
        $nowPlaying = 'Estación fuera de línea';

        if ($station->status !== 'online') {
            return [
                'listeners' => 0,
                'now_playing' => $nowPlaying,
            ];
        }

        $nowPlaying = 'Reproduciendo…';

        // 1. VIDEO STATIONS (NGINX RTMP / HLS)
        if ($station->type === 'video') {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(1)->get("http://localhost:{$station->port}/stat");
                if ($response->successful()) {
                    $xml = simplexml_load_string($response->body());
                    if ($xml) {
                        foreach ($xml->server->application as $app) {
                            if (isset($app->live->stream)) {
                                foreach ($app->live->stream as $stream) {
                                    if ((string)$stream->name === (string)$station->stream_key) {
                                        $listeners = max(0, (int)$stream->nclients - 1);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                $listeners = 0;
            }
            return [
                'listeners' => $listeners,
                'now_playing' => 'Transmisión de Televisión en Vivo',
            ];
        }

        // 2. AUDIO STATIONS (Icecast / SHOUTcast)
        if ($station->frontend === 'shoutcast') {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(1)->get("http://localhost:{$station->port}/stats?sid=1&json=1");
                if ($response->successful()) {
                    $data = $response->json();
                    $listeners = (int)($data['uniquelisteners'] ?? $data['currentlisteners'] ?? 0);
                    $nowPlaying = $data['songtitle'] ?? 'Transmisión de Audio en Vivo';
                }
            } catch (\Exception $e) {
                $listeners = 0;
            }
        } else {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(1)->get("http://localhost:{$station->port}/status-json.xsl");
                if ($response->successful()) {
                    $data = $response->json();
                    $source = $data['icestats']['source'] ?? null;
                    if ($source) {
                        if (isset($source['listeners'])) {
                            $listeners = (int)$source['listeners'];
                            $nowPlaying = $source['title'] ?? 'Transmisión de Audio en Vivo';
                        } else if (is_array($source) && isset($source[0])) {
                            $listeners = (int)($source[0]['listeners'] ?? 0);
                            $nowPlaying = $source[0]['title'] ?? 'Transmisión de Audio en Vivo';
                        }
                    }
                }
            } catch (\Exception $e) {
                $listeners = 0;
            }
        }

        $this->trackNowPlaying($station, $nowPlaying);

        return [
            'listeners' => $listeners,
            'now_playing' => $nowPlaying,
        ];
    }

    private function trackNowPlaying(Station $station, string $nowPlaying): void
    {
        if ($nowPlaying === 'Estación fuera de línea' || $nowPlaying === 'Reproduciendo…') {
            return;
        }

        $key = "station_{$station->id}_recently_played";
        $tracks = cache()->get($key, []);

        // Deduplicate: remove if already exists, then prepend
        $tracks = array_values(array_filter($tracks, fn(array $t) => $t['title'] !== $nowPlaying));

        array_unshift($tracks, [
            'title' => $nowPlaying,
            'played_at' => now()->format('H:i'),
            'timestamp' => now()->timestamp,
        ]);

        $tracks = array_slice($tracks, 0, 10);

        cache()->put($key, $tracks, now()->addHours(24));
    }
}
