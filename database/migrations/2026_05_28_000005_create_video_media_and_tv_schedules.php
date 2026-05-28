<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_media', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('station_id');
            $table->string('title');
            $table->string('filename');
            $table->string('path')->default('');
            $table->integer('duration')->default(0);
            $table->bigInteger('size_bytes')->default(0);
            $table->string('source')->default('upload');
            $table->string('yt_url')->nullable();
            $table->timestamps();
            $table->foreign('station_id')->references('id')->on('stations')->cascadeOnDelete();
        });

        Schema::create('tv_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('station_id');
            $table->unsignedBigInteger('video_media_id');
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->foreign('station_id')->references('id')->on('stations')->cascadeOnDelete();
            $table->foreign('video_media_id')->references('id')->on('video_media')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tv_schedules');
        Schema::dropIfExists('video_media');
    }
};
