<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles (idempotent)
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $clientRole = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);

        // Create permissions
        $permissions = [
            'manage-stations',
            'manage-tv-channels',
            'manage-clients',
            'manage-media',
            'manage-playlists',
            'manage-schedules',
            'view-statistics',
            'view-audit-logs',
            'manage-settings',
            'upload-media',
            'manage-dj-accounts',
            'start-streaming',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign all permissions to admin
        $adminRole->syncPermissions(Permission::all());

        // Assign limited permissions to client
        $clientRole->syncPermissions([
            'upload-media',
            'manage-playlists',
            'manage-schedules',
            'view-statistics',
            'start-streaming',
            'manage-dj-accounts',
        ]);

        // Create admin user (idempotent)
        $admin = User::firstOrCreate(
            ['email' => 'info@hostuis.com'],
            [
                'name' => 'Administrador',
                'password' => bcrypt('Emely.2012@#'),
                'email_verified_at' => now(),
                'timezone' => 'America/Mexico_City',
            ]
        );
        $admin->assignRole('admin');

        // Create demo client (idempotent)
        $client = User::firstOrCreate(
            ['email' => 'cliente@tuistream.local'],
            [
                'name' => 'Cliente Demo',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'timezone' => 'America/Mexico_City',
            ]
        );
        $client->assignRole('client');
    }
}
