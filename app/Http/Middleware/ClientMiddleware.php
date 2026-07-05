<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ClientMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check() || !auth()->user()->isClient()) {
            abort(403, 'Acceso no autorizado.');
        }

        if (auth()->user()->is_suspended) {
            auth()->logout();
            return redirect()->route('login')->with('error', 'Tu cuenta ha sido suspendida.');
        }

        return $next($request);
    }
}
