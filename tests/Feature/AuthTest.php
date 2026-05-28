<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->user = User::factory()->create([
        'email' => 'test@tuistream.local',
        'password' => Hash::make('password123'),
        'role' => 'admin',
        'status' => 'active',
    ]);
});

test('login page is accessible', function () {
    $response = $this->get('/login');
    $response->assertOk();
});

test('login with valid credentials redirects to dashboard', function () {
    $response = $this->post('/login', [
        'email' => 'test@tuistream.local',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/admin/dashboard');
    $this->assertAuthenticated();
});

test('login with invalid credentials returns error', function () {
    $response = $this->from('/login')->post('/login', [
        'email' => 'test@tuistream.local',
        'password' => 'wrongpassword',
    ]);

    $response->assertRedirect('/login');
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('authenticated user cannot access login page', function () {
    $this->actingAs($this->user)
        ->get('/login')
        ->assertRedirect('/admin/dashboard');
});

test('logout clears session', function () {
    $this->actingAs($this->user)
        ->post('/logout')
        ->assertRedirect('/');

    $this->assertGuest();
});

test('client cannot access admin routes', function () {
    $client = User::factory()->create([
        'role' => 'client',
        'status' => 'active',
    ]);

    $this->actingAs($client)
        ->get('/admin/dashboard')
        ->assertRedirect('/dashboard');
});

test('super admin can access admin routes', function () {
    $admin = User::factory()->create([
        'role' => 'super_admin',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->get('/admin/dashboard')
        ->assertOk();
});

test('health endpoint returns ok', function () {
    $response = $this->get('/health');
    $response->assertOk();
    $response->assertJson(['status' => 'ok']);
});
