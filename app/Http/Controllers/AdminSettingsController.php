<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminSettingsController extends Controller
{
    private array $defaultSettings = [
        'app_name' => ['value' => 'TuiStream', 'type' => 'string', 'group' => 'general'],
        'app_timezone' => ['value' => 'UTC', 'type' => 'string', 'group' => 'general'],
        'app_language' => ['value' => 'es', 'type' => 'string', 'group' => 'general'],
        'app_logo' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'app_favicon' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'company_name' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'company_address' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'company_phone' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'company_email' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'company_tax_id' => ['value' => '', 'type' => 'string', 'group' => 'general'],
        'server_domain_type' => ['value' => 'domain', 'type' => 'string', 'group' => 'services'],
        'server_domain' => ['value' => '', 'type' => 'string', 'group' => 'services'],
        'base_port' => ['value' => '8000', 'type' => 'integer', 'group' => 'services'],
        'default_max_listeners' => ['value' => '100', 'type' => 'integer', 'group' => 'services'],
        'smtp_host' => ['value' => '', 'type' => 'string', 'group' => 'email'],
        'smtp_port' => ['value' => '587', 'type' => 'integer', 'group' => 'email'],
        'smtp_user' => ['value' => '', 'type' => 'string', 'group' => 'email'],
        'smtp_password' => ['value' => '', 'type' => 'string', 'group' => 'email'],
        'smtp_encryption' => ['value' => 'tls', 'type' => 'string', 'group' => 'email'],
        'mail_from_address' => ['value' => '', 'type' => 'string', 'group' => 'email'],
        'mail_from_name' => ['value' => 'TuiStream', 'type' => 'string', 'group' => 'email'],
        'html_head' => ['value' => '', 'type' => 'string', 'group' => 'html'],
        'html_footer' => ['value' => '', 'type' => 'string', 'group' => 'html'],
        'maintenance_mode' => ['value' => '0', 'type' => 'boolean', 'group' => 'misc'],
        'admin_notes' => ['value' => '', 'type' => 'string', 'group' => 'misc'],
        'api_access' => ['value' => 'disabled', 'type' => 'string', 'group' => 'misc'],
        'recaptcha_failed_logins' => ['value' => '0', 'type' => 'boolean', 'group' => 'misc'],
        'recaptcha_site_key' => ['value' => '', 'type' => 'string', 'group' => 'misc'],
        'recaptcha_secret' => ['value' => '', 'type' => 'string', 'group' => 'misc'],
        'facebook_app_id' => ['value' => '', 'type' => 'string', 'group' => 'misc'],
        'facebook_app_secret' => ['value' => '', 'type' => 'string', 'group' => 'misc'],
        'stats_retention_days' => ['value' => '90', 'type' => 'integer', 'group' => 'statistics'],
        'enable_metrics' => ['value' => '1', 'type' => 'boolean', 'group' => 'statistics'],
        'default_audio_player_iframe' => ['value' => '', 'type' => 'string', 'group' => 'video_players'],
        'default_video_player_iframe' => ['value' => '', 'type' => 'string', 'group' => 'video_players'],
        'enable_clappr' => ['value' => '0', 'type' => 'boolean', 'group' => 'video_players'],
        'enable_videojs' => ['value' => '1', 'type' => 'boolean', 'group' => 'video_players'],
        'enable_html5_generic' => ['value' => '1', 'type' => 'boolean', 'group' => 'video_players'],
        'default_video_player' => ['value' => 'videojs', 'type' => 'string', 'group' => 'video_players'],
        'itunes_enabled' => ['value' => '1', 'type' => 'boolean', 'group' => 'albums'],
        'lastfm_enabled' => ['value' => '0', 'type' => 'boolean', 'group' => 'albums'],
        'lastfm_api_key' => ['value' => '', 'type' => 'string', 'group' => 'albums'],
        'media_service_nginx_rtmp' => ['value' => '1', 'type' => 'boolean', 'group' => 'plugins'],
        'media_service_icecast' => ['value' => '1', 'type' => 'boolean', 'group' => 'plugins'],
        'media_service_shoutcast' => ['value' => '1', 'type' => 'boolean', 'group' => 'plugins'],
        'autodj_service_liquidsoap' => ['value' => '1', 'type' => 'boolean', 'group' => 'plugins'],
        'nginx_rtmp_image' => ['value' => 'tiangolo/nginx-rtmp:latest', 'type' => 'string', 'group' => 'plugins'],
        'icecast_image' => ['value' => 'libretime/icecast:2.5.0', 'type' => 'string', 'group' => 'plugins'],
        'shoutcast_image' => ['value' => 'khartool/shoutcast-x64:2.6.1.777-3.19.1', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_image' => ['value' => 'savonet/liquidsoap:v2.2.5', 'type' => 'string', 'group' => 'plugins'],
        'nginx_rtmp_httpport' => ['value' => '19350', 'type' => 'integer', 'group' => 'plugins'],
        'nginx_rtmp_httpsport' => ['value' => '19360', 'type' => 'integer', 'group' => 'plugins'],
        'nginx_rtmp_transcoder_preset' => ['value' => 'ultrafast', 'type' => 'string', 'group' => 'plugins'],
        'nginx_rtmp_log_output' => ['value' => 'No', 'type' => 'string', 'group' => 'plugins'],
        'icecast_os' => ['value' => '*nix', 'type' => 'string', 'group' => 'plugins'],
        'icecast_executable' => ['value' => '/usr/local/tuisream/icecastkh/bin/icecast', 'type' => 'string', 'group' => 'plugins'],
        'icecast_share_path' => ['value' => '/usr/local/tuisream/icecastkh/share/icecast', 'type' => 'string', 'group' => 'plugins'],
        'shoutcast_os' => ['value' => 'linux64', 'type' => 'string', 'group' => 'plugins'],
        'shoutcast_default_version' => ['value' => '2.6+', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_performance' => ['value' => 'Balanced', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_aac_encoder' => ['value' => 'mpeg4_aac_lc', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_afterburner' => ['value' => 'enabled', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_log_output' => ['value' => 'No', 'type' => 'string', 'group' => 'plugins'],
        'liquidsoap_dj_port' => ['value' => '6800', 'type' => 'integer', 'group' => 'plugins'],
    ];

    public function index(?string $section = null)
    {
        $this->seedDefaults();

        $activeSection = $section ?: 'general';

        $settings = Setting::where('group', $activeSection)
            ->pluck('value', 'key')
            ->toArray();

        return Inertia::render('Admin/Settings', [
            'activeSection' => $activeSection,
            'settings' => $settings,
            'sections' => [
                'general' => 'General',
                'services' => 'Services',
                'video_players' => 'Video Players',
                'albums' => 'Albums',
                'email' => 'Email',
                'plugins' => 'Plugins',
                'statistics' => 'Statistics',
                'backups' => 'Backups',
                'html' => 'HTML',
                'misc' => 'Misc.',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'group' => ['required', 'string'],
            'settings' => ['required', 'array'],
        ]);

        foreach ($validated['settings'] as $key => $value) {
            // Check if this setting is a file upload
            if ($request->hasFile("settings.{$key}")) {
                $file = $request->file("settings.{$key}");
                $filename = $key . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads'), $filename);
                $value = '/uploads/' . $filename;
            }
            
            // If value is null or empty, and it is a logo/favicon file key and no new file was uploaded, preserve existing setting
            if (($key === 'app_logo' || $key === 'app_favicon') && empty($value) && !$request->hasFile("settings.{$key}")) {
                continue;
            }

            $default = $this->defaultSettings[$key] ?? ['type' => 'string', 'group' => $validated['group']];
            Setting::set($key, $value, $default['type'], $validated['group']);
        }

        return back()->with('success', 'Ajustes guardados correctamente.');
    }

    private function seedDefaults(): void
    {
        foreach ($this->defaultSettings as $key => $config) {
            if (! Setting::where('key', $key)->exists()) {
                Setting::set($key, $config['value'], $config['type'], $config['group']);
            }
        }
    }
}
