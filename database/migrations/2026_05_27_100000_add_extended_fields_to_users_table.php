<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('phone')->nullable()->after('email');
            $table->enum('status', ['active', 'disabled'])->default('active')->after('role');
            $table->enum('api_access', ['active', 'disabled'])->default('disabled')->after('status');
            $table->boolean('send_welcome_email')->default(false)->after('api_access');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'phone', 'status', 'api_access', 'send_welcome_email']);
        });
    }
};
