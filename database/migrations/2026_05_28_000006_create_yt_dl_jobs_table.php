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
            $table->unsignedBigInteger('station_id');
            $table->string('url');
            $table->integer('pid')->nullable();
            $table->string('status')->default('downloading');
            $table->integer('progress')->default(0);
            $table->string('title')->nullable();
            $table->string('error')->nullable();
            $table->timestamps();
            $table->foreign('station_id')->references('id')->on('stations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yt_dl_jobs');
    }
};
