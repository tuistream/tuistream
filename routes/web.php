<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminFeatureController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminStatisticsController;
use App\Http\Controllers\ClientDashboardController;
use App\Http\Controllers\ClientStationController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\AdminEmailTemplateController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing Page de Bienvenida
Route::get('/', function () {
    return Inertia::render('Welcome');
});

// ── Wizard de Instalación / Primer Inicio ──────────────────────────────────
// Solo se muestra si no hay ningún administrador creado aún.
Route::get('/setup', [SetupController::class, 'index'])->name('setup.index');
Route::get('/setup/account', [SetupController::class, 'account'])->name('setup.account');
Route::post('/setup/create-admin', [SetupController::class, 'createAdmin'])->name('setup.create-admin');
Route::get('/setup/finalize', [SetupController::class, 'finalize'])->name('setup.finalize');

// Páginas Públicas de Streaming (Sin Autenticación)
Route::get('/public/station/{slug}', [ClientStationController::class, 'viewPublicAudio'])->name('public.station.view');
Route::get('/public/canaltv/{slug}', [ClientStationController::class, 'viewPublicVideo'])->name('public.canaltv.view');

// Facebook Stream Targets OAuth Callback
Route::get('/controller/StreamTargets/fbauth', [AuthController::class, 'facebookAuthCallback']);

// Rutas de Autenticación (Invitados)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Cerrar sesión (Cualquier usuario autenticado)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::post('/admin/stop-impersonating', [AuthController::class, 'stopImpersonating'])->middleware('auth');

// Rutas del Panel del Cliente (Requiere autenticación)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [ClientDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/profile', [ClientDashboardController::class, 'showProfile'])->name('client.profile');
    Route::post('/dashboard/profile', [ClientDashboardController::class, 'updateProfile']);
    Route::post('/station/{station}/toggle', [ClientDashboardController::class, 'toggleStatus']);
    Route::post('/station/{station}/restart', [ClientDashboardController::class, 'restartStation']);

    // Rutas para Streaming de Audio (Radio)
    Route::get('/dashboard/station/{station}', [ClientStationController::class, 'showAudio'])->name('client.station.show');
    Route::get('/dashboard/station/{station}/config', [ClientStationController::class, 'configAudio'])->name('client.station.config');
    Route::get('/dashboard/station/{station}/media', [ClientStationController::class, 'mediaAudio'])->name('client.station.media');
    Route::get('/dashboard/station/{station}/playlists', [ClientStationController::class, 'playlistsAudio'])->name('client.station.playlists');
    Route::get('/dashboard/station/{station}/jingles', [ClientStationController::class, 'jinglesAudio'])->name('client.station.jingles');
    Route::get('/dashboard/station/{station}/schedule', [ClientStationController::class, 'scheduleAudio'])->name('client.station.schedule');
    Route::get('/dashboard/station/{station}/widgets', [ClientStationController::class, 'widgetsAudio'])->name('client.station.widgets');
    Route::get('/dashboard/station/{station}/public', [ClientStationController::class, 'publicAudio'])->name('client.station.public');
    Route::get('/dashboard/station/{station}/mount-points', [ClientStationController::class, 'mountPointsAudio'])->name('client.station.mountpoints');
    Route::get('/dashboard/station/{station}/djs', [ClientStationController::class, 'djsAudio'])->name('client.station.djs');
    Route::get('/dashboard/station/{station}/song-title', [ClientStationController::class, 'songTitleAudio'])->name('client.station.songtitle');
    Route::get('/dashboard/station/{station}/logs', [ClientStationController::class, 'logsAudio'])->name('client.station.logs');
    Route::get('/dashboard/station/{station}/reports', [ClientStationController::class, 'reportsAudio'])->name('client.station.reports');
    Route::get('/dashboard/station/{station}/suspend', [ClientStationController::class, 'suspendAudio'])->name('client.station.suspend');
    Route::get('/dashboard/station/{station}/delete', [ClientStationController::class, 'deleteAudio'])->name('client.station.delete');

    Route::post('/dashboard/station/{station}/config', [ClientStationController::class, 'updateConfig']);
    Route::post('/dashboard/station/{station}/toggle', [ClientStationController::class, 'toggleStatus']);
    Route::post('/dashboard/station/{station}/restart', [ClientStationController::class, 'restartStation']);
    Route::post('/dashboard/station/{station}/media', [ClientStationController::class, 'uploadFile']);
    Route::delete('/dashboard/station/{station}/media/{file}', [ClientStationController::class, 'deleteFile']);
    Route::post('/dashboard/station/{station}/suspend', [ClientStationController::class, 'suspendStation']);
    Route::post('/dashboard/station/{station}/delete', [ClientStationController::class, 'deleteStation']);

    // DJs CRUD
    Route::get('/dashboard/station/{station}/djs/list', [ClientStationController::class, 'djsList'])->name('client.station.djs.list');
    Route::post('/dashboard/station/{station}/djs/store', [ClientStationController::class, 'djsStore'])->name('client.station.djs.store');
    Route::put('/dashboard/station/{station}/djs/{dj}', [ClientStationController::class, 'djsUpdate'])->name('client.station.djs.update');
    Route::delete('/dashboard/station/{station}/djs/{dj}', [ClientStationController::class, 'djsDestroy'])->name('client.station.djs.destroy');
    Route::post('/dashboard/station/{station}/djs/{dj}/toggle', [ClientStationController::class, 'djsToggle'])->name('client.station.djs.toggle');

    // Playlists CRUD
    Route::get('/dashboard/station/{station}/playlists/list', [ClientStationController::class, 'playlistsList'])->name('client.station.playlists.list');
    Route::post('/dashboard/station/{station}/playlists/store', [ClientStationController::class, 'playlistsStore'])->name('client.station.playlists.store');
    Route::put('/dashboard/station/{station}/playlists/{playlist}', [ClientStationController::class, 'playlistsUpdate'])->name('client.station.playlists.update');
    Route::delete('/dashboard/station/{station}/playlists/{playlist}', [ClientStationController::class, 'playlistsDestroy'])->name('client.station.playlists.destroy');
    Route::post('/dashboard/station/{station}/playlists/{playlist}/toggle', [ClientStationController::class, 'playlistsToggle'])->name('client.station.playlists.toggle');
    Route::post('/dashboard/station/{station}/playlists/{playlist}/add-media', [ClientStationController::class, 'playlistsAddMedia'])->name('client.station.playlists.add-media');
    Route::post('/dashboard/station/{station}/playlists/{playlist}/remove-media', [ClientStationController::class, 'playlistsRemoveMedia'])->name('client.station.playlists.remove-media');

    // Rutas para Streaming de Video (Canal TV)
    Route::get('/dashboard/canaltv/{station}', [ClientStationController::class, 'showVideo'])->name('client.canaltv.show');
    Route::get('/dashboard/canaltv/{station}/config', [ClientStationController::class, 'configVideo'])->name('client.canaltv.config');
    Route::get('/dashboard/canaltv/{station}/widgets', [ClientStationController::class, 'widgetsVideo'])->name('client.canaltv.widgets');
    Route::get('/dashboard/canaltv/{station}/public', [ClientStationController::class, 'publicVideo'])->name('client.canaltv.public');
    Route::get('/dashboard/canaltv/{station}/reports', [ClientStationController::class, 'reportsVideo'])->name('client.canaltv.reports');
    Route::get('/dashboard/canaltv/{station}/suspend', [ClientStationController::class, 'suspendVideo'])->name('client.canaltv.suspend');
    Route::get('/dashboard/canaltv/{station}/delete', [ClientStationController::class, 'deleteVideo'])->name('client.canaltv.delete');

    Route::post('/dashboard/canaltv/{station}/config', [ClientStationController::class, 'updateConfigVideo']);
    Route::post('/dashboard/canaltv/{station}/toggle', [ClientStationController::class, 'toggleStatusVideo']);
    Route::post('/dashboard/canaltv/{station}/restart', [ClientStationController::class, 'restartStationVideo']);
    Route::post('/dashboard/canaltv/{station}/suspend', [ClientStationController::class, 'suspendStationVideo']);
    Route::post('/dashboard/canaltv/{station}/delete', [ClientStationController::class, 'deleteStationVideo']);

    // Herramientas del Cliente
    Route::get('/dashboard/station/{station}/youtube-downloader', [ClientStationController::class, 'youtubePage'])->name('client.station.youtube');
    Route::post('/dashboard/station/{station}/youtube-downloader/download', [ClientStationController::class, 'youtubeDownload']);
    Route::get('/dashboard/station/{station}/web-player', [ClientStationController::class, 'webPlayerPage'])->name('client.station.web-player');
});

// Redirección /admin → /admin/dashboard
Route::get('/admin', function () {
    return redirect()->route('admin.dashboard');
})->middleware('auth');

// Rutas del Panel del Administrador
Route::middleware(['auth'])->prefix('admin')->group(function () {
    // Dashboard general
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/system-metrics', [AdminDashboardController::class, 'systemMetricsJson'])->name('admin.system-metrics');
    Route::get('/diagnostics', [AdminDashboardController::class, 'diagnosticsJson'])->name('admin.diagnostics');

    // Audio Streaming
    Route::get('/audio', [AdminDashboardController::class, 'audioIndex'])->name('admin.audio');
    Route::post('/audio/create', [AdminDashboardController::class, 'createAudioStation']);
    // Dedicated full-page create/edit for audio stations
    Route::get('/audio/create-form', [AdminDashboardController::class, 'createAudioStationForm'])->name('admin.audio.create');
    Route::post('/audio/create-full', [AdminDashboardController::class, 'createAudioStationFull'])->name('admin.audio.store');
    Route::get('/audio/{station}/edit', [AdminDashboardController::class, 'editAudioStationForm'])->name('admin.audio.edit');
    Route::post('/audio/{station}/edit', [AdminDashboardController::class, 'updateAudioStationFull'])->name('admin.audio.update');

    // Video Streaming
    Route::get('/video', [AdminDashboardController::class, 'videoIndex'])->name('admin.video');
    Route::post('/video/create', [AdminDashboardController::class, 'createVideoStation']);
    // Dedicated full-page create/edit for video stations
    Route::get('/video/create-form', [AdminDashboardController::class, 'createVideoStationForm'])->name('admin.video.create');
    Route::post('/video/create-full', [AdminDashboardController::class, 'createVideoStationFull'])->name('admin.video.store');
    Route::get('/video/{station}/edit', [AdminDashboardController::class, 'editVideoStationForm'])->name('admin.video.edit');
    Route::post('/video/{station}/edit', [AdminDashboardController::class, 'updateVideoStationFull'])->name('admin.video.update');

    // Clientes
    Route::get('/clients', [AdminDashboardController::class, 'clientsIndex'])->name('admin.clients');
    Route::get('/clients/create', [AdminDashboardController::class, 'createClientForm'])->name('admin.clients.create');
    Route::post('/clients/create', [AdminDashboardController::class, 'storeClient']);
    Route::get('/clients/{user}', [AdminDashboardController::class, 'showClient'])->name('admin.clients.show');
    Route::get('/clients/{user}/edit', [AdminDashboardController::class, 'editClientForm'])->name('admin.clients.edit');
    Route::post('/clients/{user}/edit', [AdminDashboardController::class, 'updateClient']);
    Route::delete('/clients/{user}', [AdminDashboardController::class, 'deleteClient'])->name('admin.clients.delete');
    Route::post('/clients/{user}/impersonate', [AuthController::class, 'impersonate'])->name('admin.clients.impersonate');

    // Estadísticas
    Route::get('/statistics', [AdminStatisticsController::class, 'index'])->name('admin.statistics');

    // Ajustes
    Route::get('/settings/{section?}', [AdminSettingsController::class, 'index'])->name('admin.settings');
    Route::post('/settings', [AdminSettingsController::class, 'update'])->name('admin.settings.update');

    // Plantillas de Email
    Route::get('/email-templates', [AdminEmailTemplateController::class, 'index'])->name('admin.email-templates');
    Route::post('/email-templates', [AdminEmailTemplateController::class, 'store'])->name('admin.email-templates.store');
    Route::put('/email-templates/{template}', [AdminEmailTemplateController::class, 'update'])->name('admin.email-templates.update');
    Route::delete('/email-templates/{template}', [AdminEmailTemplateController::class, 'destroy'])->name('admin.email-templates.destroy');
    Route::post('/email-templates/{template}/preview', [AdminEmailTemplateController::class, 'preview'])->name('admin.email-templates.preview');
    Route::post('/email-templates/{template}/send', [AdminEmailTemplateController::class, 'send'])->name('admin.email-templates.send');

    // Gestión de estaciones (compartido)
    Route::put('/station/{station}', [AdminDashboardController::class, 'updateStation']);
    Route::delete('/station/{station}', [AdminDashboardController::class, 'deleteStation']);

    // ── YouTube Downloader ────────────────────────────────────────
    Route::get('/youtube-downloader', [AdminFeatureController::class, 'youtubePage'])->name('admin.youtube');
    Route::post('/youtube-downloader/download', [AdminFeatureController::class, 'youtubeDownload'])->name('admin.youtube.download');
    Route::get('/youtube-downloader/info', [AdminFeatureController::class, 'youtubeInfo'])->name('admin.youtube.info');
    Route::get('/youtube-downloader/jobs', [AdminFeatureController::class, 'youtubeJobs'])->name('admin.youtube.jobs');

    // ── Web DJ (Control remoto AutoDJ) ───────────────────────────
    Route::get('/webdj/{station}', [AdminFeatureController::class, 'webDjPage'])->name('admin.webdj');
    Route::get('/webdj/{station}/stats', [AdminFeatureController::class, 'webDjStats'])->name('admin.webdj.stats');
    Route::post('/webdj/{station}/command', [AdminFeatureController::class, 'webDjCommand'])->name('admin.webdj.command');
    Route::get('/webdj/{station}/playlist/{playlist}/tracks', [AdminFeatureController::class, 'webDjPlaylistTracks'])->name('admin.webdj.tracks');

    // ── Web Player Generator ──────────────────────────────────────
    Route::get('/player-generator', [AdminFeatureController::class, 'playerGeneratorPage'])->name('admin.player-generator');

    // ── REST API Docs ─────────────────────────────────────────────
    Route::get('/api-docs', [AdminFeatureController::class, 'apiDocsPage'])->name('admin.api-docs');

    // ── Node Manager / Geo-LB ─────────────────────────────────────
    Route::get('/nodes', [AdminFeatureController::class, 'nodesPage'])->name('admin.nodes');
    Route::post('/nodes', [AdminFeatureController::class, 'nodesStore'])->name('admin.nodes.store');
    Route::delete('/nodes/{node}', [AdminFeatureController::class, 'nodesDestroy'])->name('admin.nodes.destroy');
});

// ── Public Embeddable Player ─────────────────────────────────────────────────
Route::get('/player/{slug}', [AdminFeatureController::class, 'publicPlayer'])->name('public.player');
// SEO-friendly public player routes
Route::get('/radio/{slug}', [ClientStationController::class, 'viewPublicAudio'])->name('public.radio.listen');
Route::get('/tv/{slug}', [ClientStationController::class, 'viewPublicVideo'])->name('public.tv.watch');
