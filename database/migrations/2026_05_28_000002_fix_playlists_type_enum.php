<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_type_check");
        DB::statement("ALTER TABLE playlists ADD CONSTRAINT playlists_type_check CHECK (type IN ('standard', 'scheduled', 'weighted', 'general', 'jingle'))");

        DB::statement("ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_play_mode_check");
        DB::statement("ALTER TABLE playlists ADD CONSTRAINT playlists_play_mode_check CHECK (play_mode IN ('random', 'sequential', 'shuffle'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_type_check");
        DB::statement("ALTER TABLE playlists ADD CONSTRAINT playlists_type_check CHECK (type IN ('general', 'scheduled', 'jingle', 'advanced'))");

        DB::statement("ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_play_mode_check");
        DB::statement("ALTER TABLE playlists ADD CONSTRAINT playlists_play_mode_check CHECK (play_mode IN ('random', 'sequential'))");
    }
};
