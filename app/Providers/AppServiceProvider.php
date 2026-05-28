<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Modules\Streaming\Contracts\DockerRunner;
use Modules\Streaming\Services\MockDockerRunner;
use Modules\Streaming\Services\RealDockerRunner;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DockerRunner::class, function () {
            $runner = new RealDockerRunner();
            return $runner->isAvailable() ? $runner : new MockDockerRunner();
        });
    }

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $key = 'login:' . $request->ip() . '|' . strtolower($request->input('email', ''));
            return Limit::perMinute(5)->by($key);
        });

        RateLimiter::for('login-ip', function (Request $request) {
            $key = 'login-ip:' . $request->ip();
            return Limit::perMinute(15)->by($key);
        });
    }
}
