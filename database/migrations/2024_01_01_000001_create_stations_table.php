<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('genre')->nullable();
            $table->string('website_url')->nullable();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('stream_url')->nullable();
            $table->string('stream_ssl_url')->nullable();
            $table->string('source_password')->nullable();
            $table->string('admin_password')->nullable();
            $table->integer('max_listeners')->default(100);
            $table->integer('bitrate')->default(128);
            $table->string('audio_format')->default('mp3');
            $table->boolean('auto_dj_enabled')->default(false);
            $table->string('auto_dj_status')->default('stopped');
            $table->string('current_song')->nullable();
            $table->integer('current_listeners')->default(0);
            $table->integer('peak_listeners')->default(0);
            $table->bigInteger('total_listening_time')->default(0);
            $table->timestamp('last_stream_started_at')->nullable();
            $table->string('mount_point')->nullable();
            $table->timestamps();
        });

        Schema::create('dj_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->onDelete('cascade');
            $table->string('username')->unique();
            $table->string('password');
            $table->string('display_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('max_stream_duration')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dj_accounts');
        Schema::dropIfExists('stations');
    }
};
