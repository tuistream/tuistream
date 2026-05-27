<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->enum('service_type', ['live_streaming', 'stream_relay', 'tv_station'])->default('live_streaming')->after('type');
            $table->string('ftp_password')->nullable()->after('stream_key');
            $table->string('transcoder_profile')->default('source')->after('bitrate');
            $table->integer('stream_targets_limit')->default(-1)->after('transcoder_profile'); // -1 = unlimited
            $table->json('stream_targets')->nullable()->after('stream_targets_limit');
            $table->boolean('geoip_locking')->default(false)->after('stream_targets');
            $table->boolean('ndvr_rewind')->default(false)->after('geoip_locking');
            // disk_space_limit: -1 = unlimited, otherwise MB
            $table->integer('disk_space_limit')->default(-1)->after('storage_limit');
            // data_transfer_limit: -1 = unlimited, otherwise MB
            $table->integer('data_transfer_limit')->default(-1)->after('disk_space_limit');
        });
    }

    public function down(): void
    {
        Schema::table('stations', function (Blueprint $table) {
            $table->dropColumn([
                'service_type', 'ftp_password', 'transcoder_profile',
                'stream_targets_limit', 'stream_targets', 'geoip_locking',
                'ndvr_rewind', 'disk_space_limit', 'data_transfer_limit',
            ]);
        });
    }
};
