<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $defaultPass = env('SEED_ADMIN_PASSWORD', 'admin@123_tuistream');
        $clientPass = env('SEED_CLIENT_PASSWORD', 'client@123_tuistream');

        User::factory()->create([
            'name' => 'TuiStream Admin',
            'email' => env('SEED_ADMIN_EMAIL', 'admin@localhost'),
            'password' => bcrypt($defaultPass),
            'role' => 'super_admin',
        ]);

        User::factory()->create([
            'name' => 'Demo Cliente',
            'email' => env('SEED_CLIENT_EMAIL', 'cliente@localhost'),
            'password' => bcrypt($clientPass),
            'role' => 'client',
        ]);
    }
}
