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

    public function create(): \Illuminate\Http\JsonResponse
    {
        set_time_limit(300);

        $timestamp = date('Y-m-d_H-i-s');
        $filename = "tuistream_backup_{$timestamp}";
        $tempDir = storage_path("app/backups/{$filename}");
        $pgpassFile = null;

        try {
            File::ensureDirectoryExists($tempDir);

            $dbDriver = config('database.default');
            $dbDump = "{$tempDir}/database.sql";

            if ($dbDriver === 'pgsql') {
                $pgpassFile = $this->createPgPass(
                    config('database.connections.pgsql.host'),
                    config('database.connections.pgsql.port', '5432'),
                    config('database.connections.pgsql.database'),
                    config('database.connections.pgsql.username'),
                    config('database.connections.pgsql.password')
                );

                $cmd = sprintf(
                    'pg_dump -h %s -p %s -U %s -d %s --no-owner --no-acl > %s',
                    escapeshellarg(config('database.connections.pgsql.host')),
                    escapeshellarg(config('database.connections.pgsql.port', '5432')),
                    escapeshellarg(config('database.connections.pgsql.username')),
                    escapeshellarg(config('database.connections.pgsql.database')),
                    escapeshellarg($dbDump)
                );

                $env = ['PGPASSFILE' => $pgpassFile];
                Process::run($cmd, $env);
            } elseif ($dbDriver === 'mysql') {
                $defaultsFile = $this->createMySqlDefaults(
                    config('database.connections.mysql.host'),
                    config('database.connections.mysql.port', '3306'),
                    config('database.connections.mysql.username'),
                    config('database.connections.mysql.password')
                );

                $cmd = sprintf(
                    'mysqldump --defaults-file=%s --no-tablespaces %s > %s',
                    escapeshellarg($defaultsFile),
                    escapeshellarg(config('database.connections.mysql.database')),
                    escapeshellarg($dbDump)
                );
                Process::run($cmd);

                File::delete($defaultsFile);
            } else {
                File::put($dbDump, "-- No DB backup support for driver: {$dbDriver}");
            }

            if ($pgpassFile) {
                File::delete($pgpassFile);
                $pgpassFile = null;
            }

            $storageSource = storage_path('app/public');
            if (File::exists($storageSource)) {
                File::copyDirectory($storageSource, "{$tempDir}/storage");
            }

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

            $sha256 = hash_file('sha256', $zipPath);

            $info = [
                'version' => '1.0',
                'app_name' => config('app.name'),
                'created_at' => now()->toIso8601String(),
                'php_version' => PHP_VERSION,
                'sha256' => $sha256,
            ];

            $hashPath = "{$this->backupPath}/{$filename}.sha256";
            File::put($hashPath, "{$sha256}  {$filename}.zip\n");

            File::deleteDirectory($tempDir);

            $this->pruneOld(10);

            return response()->json([
                'success' => true,
                'message' => 'Backup creado exitosamente.',
                'backup' => [
                    'name' => "{$filename}.zip",
                    'size' => $this->formatBytes(filesize($zipPath)),
                    'size_mb' => round(filesize($zipPath) / 1024 / 1024, 2),
                    'created_at' => date('d/m/Y H:i'),
                    'sha256' => $sha256,
                ],
            ]);
        } catch (\Throwable $e) {
            if ($pgpassFile && File::exists($pgpassFile)) {
                File::delete($pgpassFile);
            }
            File::deleteDirectory($tempDir);
            return response()->json([
                'success' => false,
                'message' => 'Error al crear backup: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function download(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        $name = $this->sanitizeBackupName($request->query('name', ''));
        if (!$name) {
            return response()->json(['error' => 'Nombre de backup inválido.'], 400);
        }

        $path = "{$this->backupPath}/{$name}";

        if (!File::exists($path)) {
            return response()->json(['error' => 'Backup no encontrado.'], 404);
        }

        return Response::download($path, $name, [
            'Content-Type' => 'application/zip',
        ]);
    }

    public function delete(Request $request): \Illuminate\Http\JsonResponse
    {
        $name = $this->sanitizeBackupName($request->input('name', ''));
        if (!$name) {
            return response()->json(['error' => 'Nombre de backup inválido.'], 400);
        }

        $path = "{$this->backupPath}/{$name}";
        $hashPath = "{$this->backupPath}/" . pathinfo($name, PATHINFO_FILENAME) . '.sha256';

        if (File::exists($path)) {
            File::delete($path);
            if (File::exists($hashPath)) {
                File::delete($hashPath);
            }
            return response()->json(['success' => true, 'message' => 'Backup eliminado.']);
        }

        return response()->json(['error' => 'Backup no encontrado.'], 404);
    }

    public function verify(Request $request): \Illuminate\Http\JsonResponse
    {
        $name = $this->sanitizeBackupName($request->input('name', ''));
        if (!$name) {
            return response()->json(['error' => 'Nombre de backup inválido.'], 400);
        }

        $path = "{$this->backupPath}/{$name}";
        if (!File::exists($path)) {
            return response()->json(['error' => 'Backup no encontrado.'], 404);
        }

        $hashPath = "{$this->backupPath}/" . pathinfo($name, PATHINFO_FILENAME) . '.sha256';

        if (!File::exists($hashPath)) {
            return response()->json([
                'valid' => false,
                'message' => 'No se encontró archivo de verificación para este backup.',
            ]);
        }

        $expectedHash = trim(strstr(File::get($hashPath), ' ', true) ?: File::get($hashPath));
        $actualHash = hash_file('sha256', $path);

        return response()->json([
            'valid' => hash_equals($expectedHash, $actualHash),
            'sha256' => $actualHash,
        ]);
    }

    private function createPgPass(string $host, string $port, string $database, string $username, string $password): string
    {
        $pgpassPath = storage_path('app/backups/.pgpass_' . bin2hex(random_bytes(8)));
        $line = implode(':', [$host, $port, $database, $username, $password]);
        File::put($pgpassPath, $line);

        if (PHP_OS_FAMILY !== 'Windows') {
            chmod($pgpassPath, 0600);
        }

        return $pgpassPath;
    }

    private function createMySqlDefaults(string $host, string $port, string $username, string $password): string
    {
        $path = storage_path('app/backups/.my_' . bin2hex(random_bytes(8)) . '.cnf');
        $content = "[client]\n";
        $content .= "host={$host}\n";
        $content .= "port={$port}\n";
        $content .= "user={$username}\n";
        $content .= "password=\"{$password}\"\n";

        File::put($path, $content);

        if (PHP_OS_FAMILY !== 'Windows') {
            chmod($path, 0600);
        }

        return $path;
    }

    private function sanitizeBackupName(string $name): string
    {
        $sanitized = basename($name);

        if ($sanitized !== $name || !str_ends_with($sanitized, '.zip')) {
            return '';
        }

        if (!preg_match('/^tuistream_backup_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.zip$/', $sanitized)) {
            return '';
        }

        return $sanitized;
    }

    private function pruneOld(int $keep): void
    {
        $files = collect(File::files($this->backupPath))
            ->filter(fn ($f) => str_ends_with($f->getFilename(), '.zip'))
            ->sortByDesc(fn ($f) => $f->getMTime());

        $toDelete = $files->slice($keep);
        foreach ($toDelete as $file) {
            $hashFile = "{$this->backupPath}/" . pathinfo($file->getFilename(), PATHINFO_FILENAME) . '.sha256';
            File::delete($file->getRealPath());
            if (File::exists($hashFile)) {
                File::delete($hashFile);
            }
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
