<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jingles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('filename');
            $table->string('path');
            $table->integer('duration')->default(0);
            $table->integer('interval')->default(4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('schedule_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('day');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('type')->default('rotation');
            $table->foreignId('playlist_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('mount_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->integer('bitrate')->default(128);
            $table->string('format')->default('MP3');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mount_points');
        Schema::dropIfExists('schedule_slots');
        Schema::dropIfExists('jingles');
    }
};
