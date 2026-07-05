<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            // === GENERAL / BRANDING ===
            ['key' => 'app_logo_url', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'URL del logo'],
            ['key' => 'app_logo_dark_url', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'URL del logo (modo oscuro)'],
            ['key' => 'app_favicon_url', 'value' => '', 'type' => 'string', 'group' => 'general', 'label' => 'URL del favicon'],
            ['key' => 'app_description', 'value' => 'Streaming Control Panel', 'type' => 'string', 'group' => 'general', 'label' => 'Descripción de la app'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'group' => 'general', 'label' => 'Modo mantenimiento'],

            // === PLAYERS ===
            ['key' => 'default_video_player', 'value' => 'videojs', 'type' => 'string', 'group' => 'players', 'label' => 'Reproductor de video por defecto'],
            ['key' => 'default_audio_player', 'value' => 'videojs', 'type' => 'string', 'group' => 'players', 'label' => 'Reproductor de audio por defecto'],
            ['key' => 'enable_videojs', 'value' => 'true', 'type' => 'boolean', 'group' => 'players', 'label' => 'Video.js v10 habilitado'],
            ['key' => 'enable_clappr', 'value' => 'false', 'type' => 'boolean', 'group' => 'players', 'label' => 'Clappr Player habilitado'],
            ['key' => 'enable_html5_generic', 'value' => 'true', 'type' => 'boolean', 'group' => 'players', 'label' => 'HTML5 nativo habilitado'],
            ['key' => 'player_autoplay', 'value' => 'true', 'type' => 'boolean', 'group' => 'players', 'label' => 'Auto-reproducción'],
            ['key' => 'player_muted', 'value' => 'false', 'type' => 'boolean', 'group' => 'players', 'label' => 'Silenciado por defecto'],
            ['key' => 'player_responsive', 'value' => 'true', 'type' => 'boolean', 'group' => 'players', 'label' => 'Responsive (fluid)'],
            ['key' => 'player_controls', 'value' => 'true', 'type' => 'boolean', 'group' => 'players', 'label' => 'Controles visibles'],
            ['key' => 'videojs_theme', 'value' => 'default', 'type' => 'string', 'group' => 'players', 'label' => 'Tema de Video.js'],
            ['key' => 'default_audio_player_iframe', 'value' => 'videojs', 'type' => 'string', 'group' => 'players', 'label' => 'Player audio en iframe'],
            ['key' => 'default_video_player_iframe', 'value' => 'videojs', 'type' => 'string', 'group' => 'players', 'label' => 'Player video en iframe'],

            // === AUTO DJ (Liquidsoap) ===
            ['key' => 'liquidsoap_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'autodj', 'label' => 'AutoDJ (Liquidsoap) habilitado'],
            ['key' => 'liquidsoap_path', 'value' => '/usr/bin/liquidsoap', 'type' => 'string', 'group' => 'autodj', 'label' => 'Ruta de Liquidsoap'],
            ['key' => 'liquidsoap_host', 'value' => '127.0.0.1', 'type' => 'string', 'group' => 'autodj', 'label' => 'Host de Liquidsoap'],
            ['key' => 'liquidsoap_port', 'value' => '8085', 'type' => 'integer', 'group' => 'autodj', 'label' => 'Puerto de Liquidsoap'],
            ['key' => 'auto_dj_crossfade', 'value' => '3', 'type' => 'integer', 'group' => 'autodj', 'label' => 'Duración de crossfade (s)'],
            ['key' => 'auto_dj_jingle_interval', 'value' => '5', 'type' => 'integer', 'group' => 'autodj', 'label' => 'Canciones entre jingles'],
            ['key' => 'auto_dj_default_playlist_mode', 'value' => 'random', 'type' => 'string', 'group' => 'autodj', 'label' => 'Modo de playlist (random/sequential)'],

            // === MEDIA SERVICES (Icecast, Shoutcast, Nginx RTMP, FFmpeg) ===
            ['key' => 'icecast_ssl_port', 'value' => '8001', 'type' => 'integer', 'group' => 'media_services', 'label' => 'Icecast SSL puerto'],
            ['key' => 'icecast_source_password', 'value' => '', 'type' => 'string', 'group' => 'media_services', 'label' => 'Icecast Source Password'],
            ['key' => 'icecast_admin_password', 'value' => '', 'type' => 'string', 'group' => 'media_services', 'label' => 'Icecast Admin Password'],
            ['key' => 'icecast_relay_password', 'value' => '', 'type' => 'string', 'group' => 'media_services', 'label' => 'Icecast Relay Password'],
            ['key' => 'shoutcast_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'media_services', 'label' => 'Shoutcast 2 habilitado'],
            ['key' => 'shoutcast_host', 'value' => '127.0.0.1', 'type' => 'string', 'group' => 'media_services', 'label' => 'Shoutcast Host'],
            ['key' => 'shoutcast_port', 'value' => '8002', 'type' => 'integer', 'group' => 'media_services', 'label' => 'Shoutcast Puerto'],
            ['key' => 'shoutcast_auth_password', 'value' => '', 'type' => 'string', 'group' => 'media_services', 'label' => 'Shoutcast Auth Password'],
            ['key' => 'nginx_rtmp_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'media_services', 'label' => 'Nginx RTMP habilitado'],
            ['key' => 'nginx_rtmp_app', 'value' => 'live', 'type' => 'string', 'group' => 'media_services', 'label' => 'Nginx RTMP Application'],
            ['key' => 'ffmpeg_path', 'value' => '/usr/bin/ffmpeg', 'type' => 'string', 'group' => 'media_services', 'label' => 'Ruta de FFmpeg'],
            ['key' => 'stream_transcoding_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'media_services', 'label' => 'Transcodificación habilitada'],
            ['key' => 'hls_segment_duration', 'value' => '6', 'type' => 'integer', 'group' => 'media_services', 'label' => 'HLS segmento (s)'],
            ['key' => 'hls_list_size', 'value' => '10', 'type' => 'integer', 'group' => 'media_services', 'label' => 'HLS lista tamaño'],

            // === NOTIFICATIONS ===
            ['key' => 'notifications_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notificaciones habilitadas'],
            ['key' => 'notify_on_stream_start', 'value' => 'false', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notificar al iniciar stream'],
            ['key' => 'notify_on_stream_stop', 'value' => 'false', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notificar al detener stream'],
            ['key' => 'notify_on_error', 'value' => 'true', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Notificar errores'],
            ['key' => 'notify_admin_email', 'value' => '', 'type' => 'string', 'group' => 'notifications', 'label' => 'Email para notificaciones'],
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
        DB::table('settings')->whereIn('key', [
            'app_logo_url', 'app_logo_dark_url', 'app_favicon_url', 'app_description', 'maintenance_mode',
            'default_video_player', 'default_audio_player', 'enable_videojs', 'enable_clappr',
            'enable_html5_generic', 'player_autoplay', 'player_muted', 'player_responsive',
            'player_controls', 'videojs_theme', 'default_audio_player_iframe', 'default_video_player_iframe',
            'liquidsoap_enabled', 'liquidsoap_path', 'liquidsoap_host', 'liquidsoap_port',
            'auto_dj_crossfade', 'auto_dj_jingle_interval', 'auto_dj_default_playlist_mode',
            'icecast_ssl_port', 'icecast_source_password', 'icecast_admin_password', 'icecast_relay_password',
            'shoutcast_enabled', 'shoutcast_host', 'shoutcast_port', 'shoutcast_auth_password',
            'nginx_rtmp_enabled', 'nginx_rtmp_app', 'ffmpeg_path', 'stream_transcoding_enabled',
            'hls_segment_duration', 'hls_list_size',
            'notifications_enabled', 'notify_on_stream_start', 'notify_on_stream_stop',
            'notify_on_error', 'notify_admin_email',
        ])->delete();
    }
};
