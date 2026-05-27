<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->string('publish_name')->nullable()->after('name');        // Nombre de Emisora (mount)
            $table->string('admin_password')->nullable()->after('publish_name');
            $table->integer('mountpoints')->default(1)->after('admin_password');          // 1-100
            $table->integer('autodj_sources')->default(1)->after('mountpoints');          // 1-100, 0=unlimited
            $table->string('autodj_service')->default('liquidsoap')->after('autodj_sources');
        });
    }

    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->dropColumn(['publish_name', 'admin_password', 'mountpoints', 'autodj_sources', 'autodj_service']);
        });
    }
};
