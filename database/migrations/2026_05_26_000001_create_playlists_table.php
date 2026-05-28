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
        Schema::create('playlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained('stations')->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['standard', 'scheduled', 'weighted', 'general', 'jingle'])->default('standard');
            $table->boolean('is_active')->default(true);
            $table->enum('play_mode', ['random', 'sequential', 'shuffle'])->default('sequential');
            $table->time('schedule_start')->nullable();
            $table->time('schedule_end')->nullable();
            $table->integer('weight')->default(5); // Prioridad/peso para reproducir canciones (1-10)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('playlists');
    }
};
