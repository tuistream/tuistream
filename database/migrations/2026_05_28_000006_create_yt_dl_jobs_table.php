<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yt_dl_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique();
            $table->unsignedBigInteger('station_id')->nullable();
            $table->string('station_name')->nullable();
            $table->string('url');
            $table->string('title')->nullable();
            $table->string('format')->nullable();
            $table->string('quality')->nullable();
            $table->string('playlist')->nullable();
            $table->string('status')->default('pending');
            $table->integer('progress')->default(0);
            $table->string('error')->nullable();
            $table->timestamps();

            $table->foreign('station_id')->references('id')->on('stations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yt_dl_jobs');
    }
};
