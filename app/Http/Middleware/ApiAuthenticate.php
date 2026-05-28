<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class ApiAuthenticate
{
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->bearerToken()
            ?? $request->query('api_token')
            ?? $request->input('api_token');

        if (!$token) {
            return response()->json([
                'error' => __('api.token_required'),
            ], 401);
        }

        $user = User::where('api_token', hash('sha256', $token))->first();

        if (!$user) {
            return response()->json([
                'error' => __('api.token_invalid'),
            ], 401);
        }

        if ($user->api_access !== 'active') {
            return response()->json([
                'error' => __('api.access_disabled'),
            ], 403);
        }

        if ($user->status === 'disabled') {
            return response()->json([
                'error' => __('api.account_disabled'),
            ], 403);
        }

        auth()->setUser($user);

        return $next($request);
    }
}
