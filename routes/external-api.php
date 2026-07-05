<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Externa v1 — TuiStream
|--------------------------------------------------------------------------
| Endpoints RESTful para integración con sistemas externos.
| Autenticación: Bearer Token (Laravel Sanctum).
|
| Documentación: /admin/api-docs
| OpenAPI JSON:  /api/v1/docs/openapi.json
*/

// ---------------------------------------------------------------------------
// Público — Health check y OpenAPI spec
// ---------------------------------------------------------------------------
Route::get('/health', fn () => response()->json([
    'status'   => 'ok',
    'app'      => 'TuiStream',
    'version'  => '1.0.0',
    'timezone' => config('app.timezone'),
    'timestamp'=> now()->toIso8601String(),
]));

Route::get('/docs/openapi.json', function () {
    $spec = app()->basePath('storage/openapi/openapi.json');
    if (!file_exists($spec)) {
        return response()->json(['error' => 'OpenAPI spec not generated.'], 404);
    }
    return response()->file($spec, [
        'Content-Type' => 'application/json',
        'Access-Control-Allow-Origin' => '*',
    ]);
});

// ---------------------------------------------------------------------------
// Rutas protegidas con token Sanctum (auth:sanctum)
// ---------------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // ── Perfil del cliente autenticado ─────────────────────────────────
    Route::get('/me', function (Request $request) {
        $user = $request->user()->load('roles');
        return response()->json([
            'data' => [
                'id'      => $user->id,
                'name'    => $user->name,
                'email'   => $user->email,
                'roles'   => $user->roles->pluck('name'),
                'is_active' => $user->is_active,
            ],
        ]);
    });

    // ── Estaciones (Radio / AutoDJ) ────────────────────────────────────
    Route::prefix('stations')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExternalApi\StationController::class, 'index']);
        Route::get('/{station}', [\App\Http\Controllers\ExternalApi\StationController::class, 'show']);
        Route::get('/{station}/listeners', [\App\Http\Controllers\ExternalApi\StationController::class, 'listeners']);
        Route::get('/{station}/song-history', [\App\Http\Controllers\ExternalApi\StationController::class, 'songHistory']);
    });

    // ── Canales de TV ──────────────────────────────────────────────────
    Route::prefix('tv-channels')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExternalApi\TvChannelController::class, 'index']);
        Route::get('/{channel}', [\App\Http\Controllers\ExternalApi\TvChannelController::class, 'show']);
        Route::get('/{channel}/viewers', [\App\Http\Controllers\ExternalApi\TvChannelController::class, 'viewers']);
        Route::get('/{channel}/schedule', [\App\Http\Controllers\ExternalApi\TvChannelController::class, 'schedule']);
    });

    // ── Medios / Biblioteca ────────────────────────────────────────────
    Route::prefix('media')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExternalApi\MediaController::class, 'index']);
        Route::get('/{media}', [\App\Http\Controllers\ExternalApi\MediaController::class, 'show']);
    });

    // ── Playlists ──────────────────────────────────────────────────────
    Route::prefix('playlists')->group(function () {
        Route::get('/', [\App\Http\Controllers\ExternalApi\PlaylistController::class, 'index']);
        Route::get('/{playlist}', [\App\Http\Controllers\ExternalApi\PlaylistController::class, 'show']);
        Route::get('/{playlist}/media', [\App\Http\Controllers\ExternalApi\PlaylistController::class, 'media']);
    });

    // ── Estadísticas ───────────────────────────────────────────────────
    Route::prefix('stats')->group(function () {
        Route::get('/summary', [\App\Http\Controllers\ExternalApi\StatsController::class, 'summary']);
        Route::get('/listeners/{station}', [\App\Http\Controllers\ExternalApi\StatsController::class, 'listenerStats']);
        Route::get('/viewers/{channel}', [\App\Http\Controllers\ExternalApi\StatsController::class, 'viewerStats']);
    });

    // ── Sincronización / Webhooks ──────────────────────────────────────
    Route::prefix('sync')->group(function () {
        Route::get('/status', [\App\Http\Controllers\ExternalApi\SyncController::class, 'status']);
        Route::post('/events', [\App\Http\Controllers\ExternalApi\SyncController::class, 'receiveEvent']);
    });
});
