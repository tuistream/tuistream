<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            // === VOD - Video on Demand Configuration ===
            ['key' => 'vod_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'VOD habilitado'],
            ['key' => 'vod_default_quality', 'value' => '1080p', 'type' => 'string', 'group' => 'vod', 'label' => 'Calidad por defecto'],

            // HLS Encoding
            ['key' => 'vod_hls_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'HLS habilitado'],
            ['key' => 'vod_hls_segment_duration', 'value' => '6', 'type' => 'integer', 'group' => 'vod', 'label' => 'HLS duración de segmento (s)'],
            ['key' => 'vod_hls_list_size', 'value' => '10', 'type' => 'integer', 'group' => 'vod', 'label' => 'HLS tamaño de lista'],
            ['key' => 'vod_hls_encryption', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'HLS encriptación AES-128'],

            // DASH Encoding
            ['key' => 'vod_dash_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'MPEG-DASH habilitado'],
            ['key' => 'vod_dash_segment_duration', 'value' => '4', 'type' => 'integer', 'group' => 'vod', 'label' => 'DASH duración de segmento (s)'],
            ['key' => 'vod_dash_encryption', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'DASH encriptación CENC'],

            // Transcoding Profiles
            ['key' => 'vod_transcoding_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Transcodificación habilitada'],
            ['key' => 'vod_transcoding_presets', 'value' => '1080p,720p,480p,360p', 'type' => 'string', 'group' => 'vod', 'label' => 'Presets de transcodificación'],
            ['key' => 'vod_transcoding_codec', 'value' => 'h264', 'type' => 'string', 'group' => 'vod', 'label' => 'Codec de video (h264/h265/av1)'],
            ['key' => 'vod_transcoding_audio_codec', 'value' => 'aac', 'type' => 'string', 'group' => 'vod', 'label' => 'Codec de audio (aac/mp3/opus)'],
            ['key' => 'vod_transcoding_bitrate_1080p', 'value' => '8000', 'type' => 'integer', 'group' => 'vod', 'label' => 'Bitrate 1080p (Kbps)'],
            ['key' => 'vod_transcoding_bitrate_720p', 'value' => '4000', 'type' => 'integer', 'group' => 'vod', 'label' => 'Bitrate 720p (Kbps)'],
            ['key' => 'vod_transcoding_bitrate_480p', 'value' => '2000', 'type' => 'integer', 'group' => 'vod', 'label' => 'Bitrate 480p (Kbps)'],
            ['key' => 'vod_transcoding_bitrate_360p', 'value' => '1000', 'type' => 'integer', 'group' => 'vod', 'label' => 'Bitrate 360p (Kbps)'],

            // Bandwidth Limits
            ['key' => 'vod_max_bitrate', 'value' => '15000', 'type' => 'integer', 'group' => 'vod', 'label' => 'Bitrate máximo (Kbps)'],
            ['key' => 'vod_adaptive_bitrate', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Bitrate adaptativo (ABR)'],
            ['key' => 'vod_bandwidth_throttling', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Limitación de ancho de banda'],

            // DRM / Content Protection
            ['key' => 'vod_drm_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'DRM habilitado'],
            ['key' => 'vod_drm_widevine', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Google Widevine'],
            ['key' => 'vod_drm_playready', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Microsoft PlayReady'],
            ['key' => 'vod_drm_fairplay', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Apple FairPlay'],
            ['key' => 'vod_drm_license_url', 'value' => '', 'type' => 'string', 'group' => 'vod', 'label' => 'URL del servidor de licencias DRM'],

            // CDN Configuration
            ['key' => 'vod_cdn_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'CDN habilitado'],
            ['key' => 'vod_cdn_base_url', 'value' => '', 'type' => 'string', 'group' => 'vod', 'label' => 'CDN URL base'],
            ['key' => 'vod_cdn_token_auth', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'CDN autenticación por token'],
            ['key' => 'vod_cdn_token_secret', 'value' => '', 'type' => 'string', 'group' => 'vod', 'label' => 'CDN token secreto'],

            // Storage
            ['key' => 'vod_storage_driver', 'value' => 'local', 'type' => 'string', 'group' => 'vod', 'label' => 'Driver de almacenamiento (local/s3/ftp)'],
            ['key' => 'vod_max_file_size', 'value' => '5120', 'type' => 'integer', 'group' => 'vod', 'label' => 'Tamaño máximo de archivo (MB)'],
            ['key' => 'vod_allowed_formats', 'value' => 'mp4,mkv,avi,mov,wmv,flv,webm', 'type' => 'string', 'group' => 'vod', 'label' => 'Formatos permitidos'],

            // Playback
            ['key' => 'vod_autoplay', 'value' => 'false', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Auto-reproducción'],
            ['key' => 'vod_resume_playback', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Reanudar reproducción'],
            ['key' => 'vod_thumbnail_generation', 'value' => 'true', 'type' => 'boolean', 'group' => 'vod', 'label' => 'Generación de miniaturas'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'type' => $setting['type'],
                    'group' => $setting['group'],
                    'label' => $setting['label'],
                    'updated_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('group', 'vod')->delete();
    }
};
