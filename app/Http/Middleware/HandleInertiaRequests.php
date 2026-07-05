<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HandleInertiaRequests
{
    public function handle(Request $request, Closure $next)
    {
        Inertia::share([
            'auth' => [
                'user' => function () use ($request) {
                    if (Auth::check()) {
                        $user = Auth::user();
                        $impersonatedById = $request->session()->get('impersonated_by');
                        $impersonatedBy = $impersonatedById ? \App\Models\User::find($impersonatedById) : null;

                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'avatar' => $user->avatar,
                            'roles' => $user->getRoleNames(),
                            'permissions' => $user->getAllPermissions()->pluck('name'),
                            'impersonated_by' => $impersonatedBy ? [
                                'id' => $impersonatedBy->id,
                                'name' => $impersonatedBy->name,
                            ] : null,
                        ];
                    }
                    return null;
                },
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'app' => [
                'name' => config('app.name'),
                'version' => config('tuistream.version'),
            ],
            'branding' => [
                'app_name' => Setting::getValue('app_name', config('app.name')),
                'app_description' => Setting::getValue('app_description', 'Panel de Control de Streaming'),
                'logo_url' => Setting::getValue('app_logo_url'),
                'logo_dark_url' => Setting::getValue('app_logo_dark_url'),
                'favicon_url' => Setting::getValue('app_favicon_url'),
            ],
        ]);

        return $next($request);
    }
}
