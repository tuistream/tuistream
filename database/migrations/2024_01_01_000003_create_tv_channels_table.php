<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tv_channels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->string('channel_type')->default('tv_247');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('rtmp_url')->nullable();
            $table->string('hls_url')->nullable();
            $table->string('dash_url')->nullable();
            $table->string('stream_key')->nullable();
            $table->integer('current_viewers')->default(0);
            $table->integer('peak_viewers')->default(0);
            $table->string('current_program')->nullable();
            $table->string('resolution')->default('1920x1080');
            $table->integer('bitrate')->default(4000);
            $table->boolean('auto_schedule_enabled')->default(false);
            $table->timestamp('last_stream_started_at')->nullable();
            $table->timestamps();
        });

        Schema::create('video_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tv_channel_id')->constrained()->onDelete('cascade');
            $table->foreignId('media_id')->nullable()->constrained('media')->onDelete('set null');
            $table->string('title');
            $table->timestamp('start_time');
            $table->timestamp('end_time');
            $table->json('days_of_week')->nullable();
            $table->timestamp('repeat_until')->nullable();
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('viewer_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tv_channel_id')->constrained()->onDelete('cascade');
            $table->integer('viewers')->default(0);
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamp('disconnected_at')->nullable();
            $table->integer('duration')->nullable();
            $table->timestamps();

            $table->index('connected_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('viewer_stats');
        Schema::dropIfExists('video_schedules');
        Schema::dropIfExists('tv_channels');
    }
};
