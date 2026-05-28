<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminRole
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            if ($request->expectsJson() || $request->is('admin/api/*')) {
                return response()->json([
                    'error' => 'Acceso denegado. Se requiere rol super_admin.',
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', 'No tienes permisos para acceder al panel de administración.');
        }

        return $next($request);
    }
}
