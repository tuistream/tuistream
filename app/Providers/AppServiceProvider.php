<?php

namespace App\Providers;

use App\Models\Setting;
use App\Models\Station;
use App\Models\TvChannel;
use App\Policies\StationPolicy;
use App\Policies\TvChannelPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Register Policies
        Gate::policy(Station::class, StationPolicy::class);
        Gate::policy(TvChannel::class, TvChannelPolicy::class);

        // Rate limiting para API externa (120 req/min por usuario/IP)
        RateLimiter::for('api', function (Request $request) {
            $key = $request->user()?->id
                ? 'api-user:' . $request->user()->id
                : 'api-ip:' . $request->ip();

            return Limit::perMinute(120)->by($key);
        });

        // Share branding data with all Blade views (for favicon, OG tags, etc.)
        View::composer('app', function ($view) {
            $faviconUrl = Setting::getValue('app_favicon_url')
                ?: Setting::getValue('app_logo_url')
                ?: null;

            $view->with('faviconUrl', $faviconUrl);
        });
    }
}
