<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class HorizonServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \Laravel\Horizon\Horizon::auth(function ($request) {
            return auth()->check() && auth()->user()->isAdmin();
        });
    }
}
