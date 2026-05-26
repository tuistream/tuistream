<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'TuiStream Admin',
            'email' => 'admin@tuistream.com',
            'password' => bcrypt('admin123'),
            'role' => 'super_admin',
        ]);

        User::factory()->create([
            'name' => 'Demo Cliente',
            'email' => 'cliente@tuistream.com',
            'password' => bcrypt('cliente123'),
            'role' => 'client',
        ]);
    }
}
