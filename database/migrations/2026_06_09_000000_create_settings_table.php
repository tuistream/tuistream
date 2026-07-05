<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->string('group')->default('general'); // general, streaming, email, security
            $table->string('label')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        $this->seedDefaults();
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }

    private function seedDefaults(): void
    {
        $defaults = [
            ['key' => 'app_name', 'value' => 'TuiStream', 'type' => 'string', 'group' => 'general', 'label' => 'Nombre de la aplicación'],
            ['key' => 'app_timezone', 'value' => 'America/Mexico_City', 'type' => 'string', 'group' => 'general', 'label' => 'Zona horaria'],
            ['key' => 'app_locale', 'value' => 'es', 'type' => 'string', 'group' => 'general', 'label' => 'Idioma'],
            ['key' => 'default_listeners', 'value' => '100', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Oyentes por defecto'],
            ['key' => 'default_bitrate', 'value' => '128', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Bitrate por defecto (Kbps)'],
            ['key' => 'max_upload_size', 'value' => '512', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Tamaño máximo de subida (MB)'],
            ['key' => 'disk_quota_per_client', 'value' => '1024', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Cuota de disco por cliente (MB)'],
            ['key' => 'icecast_host', 'value' => '127.0.0.1', 'type' => 'string', 'group' => 'streaming', 'label' => 'Host de Icecast'],
            ['key' => 'icecast_port', 'value' => '8000', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Puerto de Icecast'],
            ['key' => 'rtmp_host', 'value' => '127.0.0.1', 'type' => 'string', 'group' => 'streaming', 'label' => 'Host de RTMP'],
            ['key' => 'rtmp_port', 'value' => '1935', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Puerto de RTMP'],
            ['key' => 'hls_port', 'value' => '8080', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Puerto de HLS'],
            ['key' => 'dash_port', 'value' => '8081', 'type' => 'integer', 'group' => 'streaming', 'label' => 'Puerto de DASH'],
            ['key' => 'smtp_host', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'Servidor SMTP'],
            ['key' => 'smtp_port', 'value' => '587', 'type' => 'integer', 'group' => 'email', 'label' => 'Puerto SMTP'],
            ['key' => 'smtp_encryption', 'value' => 'tls', 'type' => 'string', 'group' => 'email', 'label' => 'Encriptación SMTP'],
            ['key' => 'smtp_from_address', 'value' => '', 'type' => 'string', 'group' => 'email', 'label' => 'Email remitente'],
            ['key' => 'registration_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'Registro público habilitado'],
            ['key' => 'two_factor_enabled', 'value' => 'false', 'type' => 'boolean', 'group' => 'security', 'label' => 'Autenticación de dos factores'],
            ['key' => 'session_lifetime', 'value' => '120', 'type' => 'integer', 'group' => 'security', 'label' => 'Duración de sesión (minutos)'],
        ];

        foreach ($defaults as $setting) {
            \Illuminate\Support\Facades\DB::table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'type' => $setting['type'],
                'group' => $setting['group'],
                'label' => $setting['label'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
