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
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('type', ['audio', 'video'])->default('audio');
            $table->enum('backend', ['liquidsoap', 'none'])->default('liquidsoap'); // AutoDJ
            $table->enum('frontend', ['icecast', 'shoutcast', 'none'])->default('icecast'); // Streaming Server
            $table->integer('port')->unique(); // Puerto dedicado del contenedor Docker
            $table->enum('status', ['online', 'offline', 'restarting', 'error'])->default('offline');
            $table->boolean('is_active')->default(true);
            $table->integer('max_listeners')->default(100);
            $table->integer('bitrate')->default(128); // e.g. 64, 128, 192, 320 kbps
            $table->unsignedBigInteger('storage_limit')->default(5368709120); // 5 GB por defecto en bytes
            $table->unsignedBigInteger('bandwidth_limit')->default(0); // 0 = ilimitado en bytes
            $table->string('stream_key')->nullable(); // Para RTMP (Video)
            $table->string('custom_domain')->nullable();
            $table->string('server_node')->default('local'); // Para administración multi-nodo futura
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stations');
    }
};
