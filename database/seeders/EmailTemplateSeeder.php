<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Bienvenida al Sistema',
                'subject' => '¡Bienvenido a TuiStream, {{client_name}}!',
                'body' => "Hola {{client_name}},\n\nTe damos la bienvenida a TuiStream. Tu cuenta ha sido creada exitosamente con el correo {{client_email}}.\n\nDesde tu panel de cliente podrás gestionar tus estaciones de streaming, monitorear estadísticas y configurar tus servicios.\n\nSaludos,\nEl equipo de TuiStream",
                'type' => 'generic',
                'variables' => ['client_name', 'client_email'],
                'is_active' => true,
            ],
            [
                'name' => 'Credenciales de Estación de Audio',
                'subject' => 'Tus credenciales de streaming de audio — {{station_name}}',
                'body' => "Hola {{client_name}},\n\nAquí tienes los datos de conexión para tu estación de audio {{station_name}}:\n\n- URL de escucha: http://{{station_url}}\n- Puerto: {{port}}\n- Frontend: {{frontend}}\n- Mountpoint: /live\n- Contraseña DJ: dj_pass_{{slug}}\n\nConfigura tu software de transmisión con estos datos.\n\nSaludos,\nEl equipo de TuiStream",
                'type' => 'audio',
                'variables' => ['client_name', 'station_name', 'station_url', 'port', 'frontend', 'slug'],
                'is_active' => true,
            ],
            [
                'name' => 'Credenciales de Estación de Video',
                'subject' => 'Tus credenciales de streaming de video — {{station_name}}',
                'body' => "Hola {{client_name}},\n\nAquí tienes los datos de conexión para tu canal de video {{station_name}}:\n\n- URL RTMP: rtmp://{{station_url}}\n- Stream Key: {{stream_key}}\n- Puerto: {{port}}\n- URL HLS: http://{{station_url}}/hls/live.m3u8\n\nConfigura OBS o tu encoder con estos datos.\n\nSaludos,\nEl equipo de TuiStream",
                'type' => 'video',
                'variables' => ['client_name', 'station_name', 'station_url', 'stream_key', 'port'],
                'is_active' => true,
            ],
            [
                'name' => 'Recuperación de Contraseña',
                'subject' => 'Recuperación de contraseña — TuiStream',
                'body' => "Hola {{client_name}},\n\nHas solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:\n\n{{reset_url}}\n\nSi no solicitaste este cambio, ignora este correo.\n\nSaludos,\nEl equipo de TuiStream",
                'type' => 'generic',
                'variables' => ['client_name', 'reset_url'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::firstOrCreate(['name' => $template['name']], $template);
        }
    }
}
