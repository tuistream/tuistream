<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Allow if user is admin, or if impersonating (has impersonated_by in session)
        if (auth()->check() && (auth()->user()->isAdmin() || session('impersonated_by'))) {
            return $next($request);
        }

        abort(403, 'Acceso no autorizado.');
    }
}
