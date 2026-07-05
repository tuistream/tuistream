<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Client\DashboardController as ClientDashboardController;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Auth routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Admin routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Impersonate client
        Route::post('/impersonate/{user}', [AuthController::class, 'impersonate'])->name('impersonate');
        Route::post('/stop-impersonating', [AuthController::class, 'stopImpersonating'])->name('stop-impersonating');

        // Placeholder routes for admin sections
        Route::get('/stations', fn () => inertia('Admin/Stations/Index'))->name('stations.index');
        Route::get('/stations/create', fn () => inertia('Admin/Stations/Create'))->name('stations.create');
        Route::get('/stations/{id}', fn () => inertia('Admin/Stations/Edit'))->name('stations.edit');

        Route::get('/tv-channels', fn () => inertia('Admin/TvChannels/Index'))->name('tv-channels.index');
        Route::get('/tv-channels/create', fn () => inertia('Admin/TvChannels/Create'))->name('tv-channels.create');
        Route::get('/tv-channels/{id}', fn () => inertia('Admin/TvChannels/Edit'))->name('tv-channels.edit');

        Route::get('/clients', fn () => inertia('Admin/Clients/Index', [
            'clients' => \App\Models\User::role('client')
                ->withCount('stations')
                ->orderBy('created_at', 'desc')
                ->paginate(25),
        ]))->name('clients.index');
        Route::get('/clients/create', fn () => inertia('Admin/Clients/Create'))->name('clients.create');
        Route::get('/clients/{id}', fn () => inertia('Admin/Clients/Edit'))->name('clients.edit');

        Route::get('/media', fn () => inertia('Admin/Media/Index'))->name('media.index');

        Route::get('/monitoring', fn () => inertia('Admin/Monitoring/Index'))->name('monitoring.index');
        Route::get('/audit-logs', fn () => inertia('Admin/AuditLogs/Index'))->name('audit-logs.index');
        Route::get('/settings', fn () => inertia('Admin/Settings/Index'))->name('settings.index');
        Route::get('/live-streaming', fn () => inertia('Admin/LiveStreaming/Index'))->name('live-streaming.index');
        Route::get('/tv-channels/{id}/schedule', fn () => inertia('Admin/TvChannels/Schedule'))->name('tv-channels.schedule');
        Route::get('/api-docs', fn () => inertia('Admin/ApiDocs/Index'))->name('api-docs.index');
    });

    // Client routes
    Route::middleware('client')->prefix('client')->name('client.')->group(function () {
        Route::get('/dashboard', [ClientDashboardController::class, 'index'])->name('dashboard');

        Route::get('/stations', fn () => inertia('Client/Stations/Index'))->name('stations.index');
        Route::get('/stations/{id}', fn () => inertia('Client/Stations/Show'))->name('stations.show');
        Route::get('/stations/{id}/autodj', fn () => inertia('Client/Stations/Show'))->name('stations.autodj');

        Route::get('/tv-channels', fn () => inertia('Client/TvChannels/Index'))->name('tv-channels.index');
        Route::get('/tv-channels/{id}', fn () => inertia('Client/TvChannels/Show'))->name('tv-channels.show');

        Route::get('/media', fn () => inertia('Client/Media/Index'))->name('media.index');

        Route::get('/statistics', fn () => inertia('Client/Statistics/Index'))->name('statistics.index');
        Route::get('/profile', fn () => inertia('Client/Profile/Index'))->name('profile.index');
    });
});

// Redirect root to dashboard or login
Route::get('/', function () {
    if (auth()->check()) {
        if (auth()->user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        return redirect()->route('client.dashboard');
    }
    return redirect()->route('login');
});
