<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;

class AdminBackupController extends Controller
{
    private string $backupPath;

    public function __construct()
    {
        $this->backupPath = storage_path('app/backups');
        File::ensureDirectoryExists($this->backupPath);
    }

    /**
     * Listar todos los backups creados.
     */
    public function list(): \Illuminate\Http\JsonResponse
    {
        $files = collect(File::files($this->backupPath))
            ->filter(fn ($f) => str_ends_with($f->getFilename(), '.zip'))
            ->map(function ($file) {
                return [
                    'name' => $file->getFilename(),
                    'size_mb' => round($file->getSize() / 1024 / 1024, 2),
                    'size' => $this->formatBytes($file->getSize()),
                    'created_at' => date('d/m/Y H:i', $file->getMTime()),
                    'timestamp' => $file->getMTime(),
                ];
            })
            ->sortByDesc('timestamp')
            ->values()
            ->toArray();

        return response()->json(['backups' => $files]);
    }

    /**
     * Crear un nuevo backup (DB + archivos de storage).
     */
    public function create(): \Illuminate\Http\JsonResponse
    {
        set_time_limit(300);

        $timestamp = date('Y-m-d_H-i-s');
        $filename = "tuistream_backup_{$timestamp}";
        $tempDir = storage_path("app/backups/{$filename}");

        try {
            File::ensureDirectoryExists($tempDir);

            // 1. Backup de la base de datos PostgreSQL
            $dbDriver = config('database.default');
            $dbDump = "{$tempDir}/database.sql";

            if ($dbDriver === 'pgsql') {
                $env = [
                    'PGPASSWORD' => config('database.connections.pgsql.password'),
                ];
                $cmd = sprintf(
                    'pg_dump -h %s -U %s -d %s --no-owner --no-acl > %s',
                    escapeshellarg(config('database.connections.pgsql.host')),
                    escapeshellarg(config('database.connections.pgsql.username')),
                    escapeshellarg(config('database.connections.pgsql.database')),
                    escapeshellarg($dbDump)
                );
                Process::run($cmd, $env);
            } elseif ($dbDriver === 'mysql') {
                $cmd = sprintf(
                    'mysqldump -h %s -u %s -p%s %s > %s 2>/dev/null',
                    escapeshellarg(config('database.connections.mysql.host')),
                    escapeshellarg(config('database.connections.mysql.username')),
                    escapeshellarg(config('database.connections.mysql.password')),
                    escapeshellarg(config('database.connections.mysql.database')),
                    escapeshellarg($dbDump)
                );
                Process::run($cmd);
            } else {
                File::put($dbDump, "-- No DB backup support for driver: {$dbDriver}");
            }

            // 2. Copiar archivos de storage importantes
            $storageSource = storage_path('app/public');
            if (File::exists($storageSource)) {
                File::copyDirectory($storageSource, "{$tempDir}/storage");
            }

            // 3. Incluir info del sistema
            $info = [
                'version' => '1.0',
                'app_name' => config('app.name'),
                'created_at' => now()->toIso8601String(),
                'php_version' => PHP_VERSION,
            ];
            File::put("{$tempDir}/backup-info.json", json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            // 4. Comprimir en ZIP
            $zipPath = "{$this->backupPath}/{$filename}.zip";
            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                $files = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($tempDir, \RecursiveDirectoryIterator::SKIP_DOTS)
                );
                foreach ($files as $file) {
                    $relative = substr($file->getRealPath(), strlen($tempDir) + 1);
                    $zip->addFile($file->getRealPath(), "{$filename}/{$relative}");
                }
                $zip->close();
            }

            // 5. Limpiar temp
            File::deleteDirectory($tempDir);

            // 6. Limitar a últimos 10 backups
            $this->pruneOld(10);

            return response()->json([
                'success' => true,
                'message' => 'Backup creado exitosamente.',
                'backup' => [
                    'name' => "{$filename}.zip",
                    'size' => $this->formatBytes(filesize($zipPath)),
                    'size_mb' => round(filesize($zipPath) / 1024 / 1024, 2),
                    'created_at' => date('d/m/Y H:i'),
                ],
            ]);
        } catch (\Throwable $e) {
            File::deleteDirectory($tempDir);
            return response()->json([
                'success' => false,
                'message' => 'Error al crear backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Descargar un backup por nombre de archivo.
     */
    public function download(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        $name = $request->query('name');
        $path = "{$this->backupPath}/{$name}";

        if (! File::exists($path)) {
            return response()->json(['error' => 'Backup no encontrado.'], 404);
        }

        return Response::download($path, $name, [
            'Content-Type' => 'application/zip',
        ]);
    }

    /**
     * Eliminar un backup.
     */
    public function delete(Request $request): \Illuminate\Http\JsonResponse
    {
        $name = $request->input('name');
        $path = "{$this->backupPath}/{$name}";

        if (File::exists($path)) {
            File::delete($path);
            return response()->json(['success' => true, 'message' => 'Backup eliminado.']);
        }

        return response()->json(['error' => 'Backup no encontrado.'], 404);
    }

    /**
     * Eliminar backups más antiguos, conservando solo $keep.
     */
    private function pruneOld(int $keep): void
    {
        $files = collect(File::files($this->backupPath))
            ->filter(fn ($f) => str_ends_with($f->getFilename(), '.zip'))
            ->sortByDesc(fn ($f) => $f->getMTime());

        $toDelete = $files->slice($keep);
        foreach ($toDelete as $file) {
            File::delete($file->getRealPath());
        }
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        return round($bytes / (1024 ** $pow), $precision) . ' ' . $units[$pow];
    }
}
