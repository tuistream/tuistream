<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            if (!Schema::hasColumn('stations', 'autodj_enabled')) {
                $table->boolean('autodj_enabled')->default(true)->after('autodj_service');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            if (Schema::hasColumn('stations', 'autodj_enabled')) {
                $table->dropColumn('autodj_enabled');
            }
        });
    }
};
