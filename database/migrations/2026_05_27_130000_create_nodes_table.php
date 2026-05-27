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
        Schema::create('nodes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip');
            $table->enum('type', ['audio', 'video', 'transcoding'])->default('audio');
            $table->string('region')->default('latam');
            $table->json('country_codes')->nullable();
            $table->enum('status', ['online', 'offline', 'degraded'])->default('online');
            $table->integer('cpu_usage')->default(0);
            $table->integer('ram_usage')->default(0);
            $table->integer('bandwidth_mbps')->default(0);
            $table->integer('max_stations')->default(50);
            $table->integer('latency_ms')->default(10);
            $table->integer('uptime_pct')->default(100);
            $table->string('api_token')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nodes');
    }
};
