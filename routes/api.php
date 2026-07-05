<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Stations API
    Route::prefix('stations')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\StationController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\StationController::class, 'store']);
        Route::get('/{station}', [\App\Http\Controllers\Api\StationController::class, 'show']);
        Route::put('/{station}', [\App\Http\Controllers\Api\StationController::class, 'update']);
        Route::delete('/{station}', [\App\Http\Controllers\Api\StationController::class, 'destroy']);
        Route::post('/{station}/start', [\App\Http\Controllers\Api\StationController::class, 'start']);
        Route::post('/{station}/stop', [\App\Http\Controllers\Api\StationController::class, 'stop']);
        Route::post('/{station}/restart', [\App\Http\Controllers\Api\StationController::class, 'restart']);
    });

    // TV Channels API
    Route::prefix('tv-channels')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\TvChannelController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\TvChannelController::class, 'store']);
        Route::get('/{channel}', [\App\Http\Controllers\Api\TvChannelController::class, 'show']);
        Route::put('/{channel}', [\App\Http\Controllers\Api\TvChannelController::class, 'update']);
        Route::delete('/{channel}', [\App\Http\Controllers\Api\TvChannelController::class, 'destroy']);
        Route::post('/{channel}/start', [\App\Http\Controllers\Api\TvChannelController::class, 'start']);
        Route::post('/{channel}/stop', [\App\Http\Controllers\Api\TvChannelController::class, 'stop']);
        Route::post('/{channel}/schedules', [\App\Http\Controllers\Api\VideoScheduleController::class, 'store']);
        Route::put('/{channel}/schedules/{schedule}', [\App\Http\Controllers\Api\VideoScheduleController::class, 'update']);
        Route::delete('/{channel}/schedules/{schedule}', [\App\Http\Controllers\Api\VideoScheduleController::class, 'destroy']);
    });

    // Media API
    Route::prefix('media')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\MediaController::class, 'index']);
        Route::post('/upload', [\App\Http\Controllers\Api\MediaController::class, 'upload']);
        Route::post('/upload-chunk', [\App\Http\Controllers\Api\MediaController::class, 'uploadChunk']);
        Route::delete('/{media}', [\App\Http\Controllers\Api\MediaController::class, 'destroy']);
        Route::post('/folders', [\App\Http\Controllers\Api\MediaController::class, 'createFolder']);
    });

    // Playlists API
    Route::prefix('playlists')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PlaylistController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\PlaylistController::class, 'store']);
        Route::put('/{playlist}', [\App\Http\Controllers\Api\PlaylistController::class, 'update']);
        Route::delete('/{playlist}', [\App\Http\Controllers\Api\PlaylistController::class, 'destroy']);
        Route::post('/{playlist}/media', [\App\Http\Controllers\Api\PlaylistController::class, 'addMedia']);
        Route::delete('/{playlist}/media/{media}', [\App\Http\Controllers\Api\PlaylistController::class, 'removeMedia']);
        Route::post('/{playlist}/reorder', [\App\Http\Controllers\Api\PlaylistController::class, 'reorder']);
        Route::post('/{playlist}/schedules', [\App\Http\Controllers\Api\PlaylistController::class, 'storeSchedule']);
        Route::put('/{playlist}/schedules/{schedule}', [\App\Http\Controllers\Api\PlaylistController::class, 'updateSchedule']);
        Route::delete('/{playlist}/schedules/{schedule}', [\App\Http\Controllers\Api\PlaylistController::class, 'destroySchedule']);
    });

    // Statistics API
    Route::prefix('stats')->group(function () {
        Route::get('/listeners/{station}', [\App\Http\Controllers\Api\StatsController::class, 'listenerStats']);
        Route::get('/viewers/{channel}', [\App\Http\Controllers\Api\StatsController::class, 'viewerStats']);
        Route::middleware('admin')->get('/server', [\App\Http\Controllers\Api\StatsController::class, 'serverStats']);
        Route::get('/geo/{station}', [\App\Http\Controllers\Api\StatsController::class, 'geoStats']);
    });

    // Clients API (admin only)
    Route::middleware('admin')->prefix('clients')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ClientController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\ClientController::class, 'store']);
        Route::get('/{user}', [\App\Http\Controllers\Api\ClientController::class, 'show']);
        Route::put('/{user}', [\App\Http\Controllers\Api\ClientController::class, 'update']);
        Route::delete('/{user}', [\App\Http\Controllers\Api\ClientController::class, 'destroy']);
        Route::post('/{user}/suspend', [\App\Http\Controllers\Api\ClientController::class, 'suspend']);
        Route::post('/{user}/unsuspend', [\App\Http\Controllers\Api\ClientController::class, 'unsuspend']);
    });

    // Audit Logs API (admin only)
    Route::middleware('admin')->prefix('audit-logs')->group(function () {
        Route::get('/', function () {
            return \App\Models\AuditLog::with('user:id,name,email')
                ->latest()
                ->paginate(50);
        });
    });

    // Settings API (admin only)
    Route::middleware('admin')->prefix('settings')->group(function () {
        Route::get('/', function () {
            return \App\Models\Setting::all()->groupBy('group');
        });
        Route::put('/', function (\Illuminate\Http\Request $request) {
            $data = $request->validate([
                'settings' => 'required|array',
                'settings.*.key' => 'required|string',
                'settings.*.value' => 'nullable|string',
            ]);

            foreach ($data['settings'] as $item) {
                \App\Models\Setting::setValue($item['key'], $item['value']);
            }

            return ['message' => 'Settings updated'];
        });

        Route::post('/upload-image', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'image' => 'required|image|max:2048',
                'key' => 'required|string|in:app_logo_url,app_logo_dark_url,app_favicon_url',
            ]);

            $file = $request->file('image');
            $path = $file->store('branding', 'public');
            $url = asset('storage/' . $path);

            \App\Models\Setting::setValue($request->key, $url);

            return ['url' => $url, 'key' => $request->key];
        });
    });

    // API Token management (admin only)
    Route::middleware('admin')->prefix('tokens')->group(function () {
        Route::post('/', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'name' => 'required|string|max:255',
                'abilities' => 'nullable|array',
            ]);

            // Admin creates token for themselves (for external system integration)
            $token = $request->user()->createToken(
                $request->name,
                $request->abilities ?? ['read']
            );

            return response()->json([
                'token' => $token->plainTextToken,
                'name'  => $request->name,
            ], 201);
        });

        Route::get('/', function (\Illuminate\Http\Request $request) {
            $tokens = $request->user()->tokens()
                ->orderBy('created_at', 'desc')
                ->get()
                ->makeHidden(['token']);

            return response()->json(['data' => $tokens]);
        });

        Route::delete('/{tokenId}', function (\Illuminate\Http\Request $request, $tokenId) {
            $request->user()->tokens()->where('id', $tokenId)->delete();

            return response()->json(['message' => 'Token revocado.'], 200);
        });
    });
});
