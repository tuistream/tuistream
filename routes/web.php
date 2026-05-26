<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\ClientDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing Page de Bienvenida
Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Rutas de Autenticación (Invitados)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Cerrar sesión (Cualquier usuario autenticado)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

// Rutas del Panel del Cliente (Requiere autenticación)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [ClientDashboardController::class, 'index'])->name('dashboard');
    Route::post('/station/{station}/toggle', [ClientDashboardController::class, 'toggleStatus']);
    Route::post('/station/{station}/restart', [ClientDashboardController::class, 'restartStation']);
});

// Rutas del Panel del Administrador (Requiere autenticación y rol de super_admin)
Route::middleware(['auth'])->group(function () {
    // Se puede implementar un middleware personalizado 'role:super_admin' más adelante.
    // Por ahora, validamos en los controladores o con un filtro simple.
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::post('/admin/station/create', [AdminDashboardController::class, 'createStation']);
    Route::delete('/admin/station/{station}', [AdminDashboardController::class, 'deleteStation']);
});
