<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SetupController extends Controller
{
    private ConnectionInterface $db;
    private CacheRepository $cache;

    public function __construct(ConnectionInterface $db, CacheRepository $cache)
    {
        $this->db = $db;
        $this->cache = $cache;
    }
    /**
     * Si ya existe algún admin, el setup no está disponible.
     */
    private function ensureNoAdmin()
    {
        if (User::where('role', 'admin')->exists()) {
            abort(404, 'El asistente de instalación ya no está disponible. El sistema ya ha sido configurado.');
        }
    }

    /**
     * Página 1: Información del sistema y bienvenida.
     */
    public function index()
    {
        $this->ensureNoAdmin();

        $checks = $this->systemChecks();

        return Inertia::render('Setup', [
            'step' => 'welcome',
            'checks' => $checks,
        ]);
    }

    /**
     * Página 2: Formulario de registro de administrador.
     */
    public function account()
    {
        $this->ensureNoAdmin();

        return Inertia::render('Setup', [
            'step' => 'account',
        ]);
    }

    /**
     * Página 3: Finalizar configuración inicial.
     */
    public function finalize()
    {
        $this->ensureNoAdmin();

        return Inertia::render('Setup', [
            'step' => 'finish',
        ]);
    }

    /**
     * Procesar creación de cuenta admin principal.
     */
    public function createAdmin(Request $request)
    {
        $this->ensureNoAdmin();

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        return redirect()->route('setup.finalize');
    }

    /**
     * Verificar servicios del sistema.
     */
    private function systemChecks(): array
    {
        $checks = [];

        // PostgreSQL
        try {
            $this->db->getPdo();
            $checks['postgresql'] = ['ok' => true, 'label' => 'PostgreSQL 17', 'version' => $this->db->select('select version()')[0]->version ?? ''];
        } catch (\Exception $e) {
            $checks['postgresql'] = ['ok' => false, 'label' => 'PostgreSQL 17', 'error' => $e->getMessage()];
        }

        // Redis
        try {
            $this->cache->get('setup_check');
            $checks['redis'] = ['ok' => true, 'label' => 'Redis 7', 'version' => 'Connected'];
        } catch (\Exception $e) {
            $checks['redis'] = ['ok' => false, 'label' => 'Redis 7', 'error' => $e->getMessage()];
        }

        // Icecast
        try {
            $icecast = @fsockopen('icecast', 8000, $errno, $errstr, 0.3);
            if ($icecast) {
                fclose($icecast);
                $checks['icecast'] = ['ok' => true, 'label' => 'Icecast 2 KH', 'version' => 'Online (puerto 8000)'];
            } else {
                $checks['icecast'] = ['ok' => false, 'label' => 'Icecast 2 KH', 'error' => "No responde en icecast:8000 — $errstr"];
            }
        } catch (\Exception $e) {
            $checks['icecast'] = ['ok' => false, 'label' => 'Icecast 2 KH', 'error' => $e->getMessage()];
        }

        // SHOUTcast
        try {
            $shoutcast = @fsockopen('shoutcast', 8000, $errno, $errstr, 0.3);
            if ($shoutcast) {
                fclose($shoutcast);
                $checks['shoutcast'] = ['ok' => true, 'label' => 'SHOUTcast 2', 'version' => 'Online (puerto 8000)'];
            } else {
                $checks['shoutcast'] = ['ok' => false, 'label' => 'SHOUTcast 2', 'error' => "No responde en shoutcast:8000 — $errstr"];
            }
        } catch (\Exception $e) {
            $checks['shoutcast'] = ['ok' => false, 'label' => 'SHOUTcast 2', 'error' => $e->getMessage()];
        }

        // Nginx-RTMP
        try {
            $rtmp = @fsockopen('nginx-rtmp', 1935, $errno, $errstr, 0.3);
            if ($rtmp) {
                fclose($rtmp);
                $checks['nginx-rtmp'] = ['ok' => true, 'label' => 'Nginx-RTMP + HLS', 'version' => 'Online (puerto 1935)'];
            } else {
                $checks['nginx-rtmp'] = ['ok' => false, 'label' => 'Nginx-RTMP + HLS', 'error' => "No responde en nginx-rtmp:1935 — $errstr"];
            }
        } catch (\Exception $e) {
            $checks['nginx-rtmp'] = ['ok' => false, 'label' => 'Nginx-RTMP + HLS', 'error' => $e->getMessage()];
        }

        // Liquidsoap
        try {
            $liquidsoap = @fsockopen('liquidsoap', 1234, $errno, $errstr, 0.3);
            if ($liquidsoap) {
                fclose($liquidsoap);
                $checks['liquidsoap'] = ['ok' => true, 'label' => 'Liquidsoap AutoDJ', 'version' => 'Online (puerto 1234)'];
            } else {
                $checks['liquidsoap'] = ['ok' => false, 'label' => 'Liquidsoap AutoDJ', 'error' => "No responde en liquidsoap:1234 — $errstr"];
            }
        } catch (\Exception $e) {
            $checks['liquidsoap'] = ['ok' => false, 'label' => 'Liquidsoap AutoDJ', 'error' => $e->getMessage()];
        }

        // PHP Version
        $checks['php'] = ['ok' => true, 'label' => 'PHP', 'version' => PHP_VERSION . ' (' . (PHP_INT_SIZE * 8) . '-bit)'];

        // Storage writable
        $checks['storage'] = ['ok' => is_writable(storage_path()), 'label' => 'Almacenamiento', 'version' => is_writable(storage_path()) ? 'Escritura OK' : 'Solo lectura'];

        return $checks;
    }
}
