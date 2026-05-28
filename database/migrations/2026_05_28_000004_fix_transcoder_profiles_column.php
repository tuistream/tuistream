<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Renombrar transcoder_profile (singular, varchar) a transcoder_profiles (plural, json)
        Schema::table('stations', function ($table) {
            if (Schema::hasColumn('stations', 'transcoder_profile') && !Schema::hasColumn('stations', 'transcoder_profiles')) {
                $table->renameColumn('transcoder_profile', 'transcoder_profiles');
            }
        });

        // Quitar default, cambiar tipo a json, luego reponer default
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles DROP DEFAULT");
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles TYPE json USING CASE WHEN transcoder_profiles IS NULL THEN '[]'::json ELSE ('[\"' || transcoder_profiles || '\"]')::json END");
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles SET DEFAULT '[]'::json");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles DROP DEFAULT");
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles TYPE character varying USING transcoder_profiles::text");
        DB::statement("ALTER TABLE stations ALTER COLUMN transcoder_profiles SET DEFAULT 'source'");

        Schema::table('stations', function ($table) {
            if (Schema::hasColumn('stations', 'transcoder_profiles') && !Schema::hasColumn('stations', 'transcoder_profile')) {
                $table->renameColumn('transcoder_profiles', 'transcoder_profile');
            }
        });
    }
};
