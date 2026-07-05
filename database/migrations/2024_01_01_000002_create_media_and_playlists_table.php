<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('parent_id')->nullable()->constrained('media_folders')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('original_name');
            $table->string('path');
            $table->string('type'); // audio, video
            $table->string('format');
            $table->bigInteger('size');
            $table->float('duration')->nullable();
            $table->integer('bitrate')->nullable();
            $table->integer('sample_rate')->nullable();
            $table->integer('channels')->nullable();
            $table->string('resolution')->nullable();
            $table->string('codec')->nullable();
            $table->json('metadata')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('folder_id')->nullable()->constrained('media_folders')->onDelete('set null');
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('playlists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('station_id')->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_jingle_playlist')->default(false);
            $table->string('playback_order')->default('sequential');
            $table->integer('crossfade_duration')->default(0);
            $table->timestamps();
        });

        Schema::create('playlist_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained()->onDelete('cascade');
            $table->foreignId('media_id')->constrained()->onDelete('cascade');
            $table->integer('order')->default(0);
            $table->integer('weight')->default(1);
            $table->float('cue_in')->nullable();
            $table->float('cue_out')->nullable();
            $table->timestamps();
        });

        Schema::create('playlist_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->json('days_of_week');
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('song_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('artist')->nullable();
            $table->string('album')->nullable();
            $table->float('duration')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->onDelete('set null');
            $table->foreignId('dj_id')->nullable()->constrained('dj_accounts')->onDelete('set null');
            $table->string('source')->default('autodj');
            $table->timestamp('played_at');
            $table->integer('listeners_at_time')->default(0);
            $table->timestamps();

            $table->index('played_at');
        });

        Schema::create('listener_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->onDelete('cascade');
            $table->integer('listeners')->default(0);
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
        Schema::dropIfExists('listener_stats');
        Schema::dropIfExists('song_history');
        Schema::dropIfExists('playlist_schedules');
        Schema::dropIfExists('playlist_media');
        Schema::dropIfExists('playlists');
        Schema::dropIfExists('media');
        Schema::dropIfExists('media_folders');
    }
};
