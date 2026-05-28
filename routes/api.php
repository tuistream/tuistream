<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\StationApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider or bootstrap/app.php.
|
*/

Route::prefix('v1')->group(function () {
    // Public health check or general stats
    Route::get('/status', function () {
        return response()->json([
            'status' => 'online',
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // We can secure these with Sanctum or simple api token middleware.
    // For local development and out-of-the-box integration, we can support both API Token Bearer and simple token request parameters.
    Route::middleware(['api', 'api.auth'])->group(function () {
        Route::get('/stations', [StationApiController::class, 'index']);
        Route::get('/stations/{id}', [StationApiController::class, 'show']);
        Route::post('/stations', [StationApiController::class, 'store']);
        Route::put('/stations/{id}', [StationApiController::class, 'update']);
        Route::delete('/stations/{id}', [StationApiController::class, 'destroy']);
        
        Route::get('/stations/{id}/stats', [StationApiController::class, 'stats']);
        Route::post('/stations/{id}/start', [StationApiController::class, 'start']);
        Route::post('/stations/{id}/stop', [StationApiController::class, 'stop']);
        Route::get('/stream/{id}/status', [StationApiController::class, 'streamStatus']);
        
        Route::get('/clients', [StationApiController::class, 'clientsIndex']);
        Route::post('/clients', [StationApiController::class, 'clientsStore']);
        
        Route::post('/youtube/download', [StationApiController::class, 'youtubeDownload']);
    });
});
