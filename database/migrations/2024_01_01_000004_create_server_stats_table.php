<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('server_stats', function (Blueprint $table) {
            $table->id();
            $table->float('cpu_usage')->default(0);
            $table->bigInteger('ram_usage')->default(0);
            $table->bigInteger('ram_total')->default(0);
            $table->bigInteger('disk_usage')->default(0);
            $table->bigInteger('disk_total')->default(0);
            $table->bigInteger('network_in')->default(0);
            $table->bigInteger('network_out')->default(0);
            $table->integer('active_streams')->default(0);
            $table->integer('active_listeners')->default(0);
            $table->integer('active_viewers')->default(0);
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index('recorded_at');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('server_stats');
    }
};
