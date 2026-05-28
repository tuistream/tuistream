<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Modules\Stations\Models\Station;

class AdminEmailTemplateController extends Controller
{
    public function index()
    {
        $templates = EmailTemplate::latest()->get()->map(fn($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'subject' => $t->subject,
            'type' => $t->type,
            'is_active' => $t->is_active,
            'created_at' => $t->created_at->format('d/m/Y H:i'),
        ]);

        $stations = Station::with('user')->get()->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'type' => $s->type,
            'client_name' => $s->user->name ?? 'N/A',
            'client_email' => $s->user->email ?? 'N/A',
            'port' => $s->port,
            'stream_key' => $s->stream_key ?? 'live',
            'frontend' => $s->frontend,
            'slug' => $s->slug,
        ]);

        return Inertia::render('Admin/EmailTemplates', [
            'templates' => $templates,
            'stations' => $stations,
            'defaultVariables' => [
                'client_name',
                'client_email',
                'station_name',
                'station_url',
                'stream_key',
                'port',
                'frontend',
                'slug',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'type' => ['required', 'string', 'in:audio,video,generic'],
            'variables' => ['nullable', 'array'],
        ]);

        EmailTemplate::create([
            'name' => $validated['name'],
            'subject' => strip_tags($validated['subject']),
            'body' => $this->sanitizeHtml($validated['body']),
            'type' => $validated['type'],
            'variables' => $validated['variables'] ?? [],
            'is_active' => true,
        ]);

        return back()->with('success', 'Plantilla creada correctamente.');
    }

    public function update(Request $request, EmailTemplate $template)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'type' => ['required', 'string', 'in:audio,video,generic'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $template->update([
            'name' => $validated['name'],
            'subject' => strip_tags($validated['subject']),
            'body' => $this->sanitizeHtml($validated['body']),
            'type' => $validated['type'],
            'variables' => $validated['variables'] ?? $template->variables,
            'is_active' => $validated['is_active'] ?? $template->is_active,
        ]);

        return back()->with('success', 'Plantilla actualizada correctamente.');
    }

    public function destroy(EmailTemplate $template)
    {
        $template->delete();
        return back()->with('success', 'Plantilla eliminada correctamente.');
    }

    public function preview(Request $request, EmailTemplate $template)
    {
        $stationId = $request->input('station_id');
        $station = Station::with('user')->find($stationId);

        $domain = Setting::get('server_domain', request()->getHost());

        $data = [
            'client_name' => $station?->user?->name ?? 'Cliente Ejemplo',
            'client_email' => $station?->user?->email ?? 'cliente@ejemplo.com',
            'station_name' => $station?->name ?? 'Estación Ejemplo',
            'station_url' => $station ? "{$domain}:{$station->port}/{$station->slug}" : "{$domain}:8000/demo",
            'stream_key' => $station?->stream_key ?? 'live',
            'port' => $station?->port ?? '8000',
            'frontend' => $station?->frontend ?? 'icecast',
            'slug' => $station?->slug ?? 'demo-station',
        ];

        return response()->json($template->render($data));
    }

    public function send(Request $request, EmailTemplate $template)
    {
        $validated = $request->validate([
            'station_id' => ['required', 'integer', 'exists:stations,id'],
            'to_email' => ['required', 'email'],
        ]);

        $station = Station::with('user')->findOrFail($validated['station_id']);
        $domain = Setting::get('server_domain', request()->getHost());

        $data = [
            'client_name' => $station->user->name ?? 'Cliente',
            'client_email' => $station->user->email ?? '',
            'station_name' => $station->name,
            'station_url' => "{$domain}:{$station->port}/{$station->slug}",
            'stream_key' => $station->stream_key ?? 'live',
            'port' => $station->port,
            'frontend' => $station->frontend,
            'slug' => $station->slug,
        ];

        $rendered = $template->render($data);

        try {
            Mail::raw($rendered['body'], function ($message) use ($validated, $rendered) {
                $fromAddress = Setting::get('mail_from_address', 'noreply@tuistream.local');
                $fromName = Setting::get('mail_from_name', 'TuiStream');
                $message->from($fromAddress, $fromName)
                    ->to($validated['to_email'])
                    ->subject($rendered['subject']);
            });

            return back()->with('success', 'Correo enviado correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al enviar correo: ' . $e->getMessage());
        }
    }

    private function sanitizeHtml(string $html): string
    {
        $allowedTags = '<p><br><b><i><u><strong><em><a><ul><ol><li>'
            . '<h1><h2><h3><h4><h5><h6>'
            . '<table><thead><tbody><tr><th><td>'
            . '<span><div><hr><blockquote><pre><code><small><sub><sup>'
            . '<img>';

        $html = strip_tags($html, $allowedTags);

        $html = preg_replace(
            '/\s(on\w+)\s*=\s*(["\'])[^"\']*\\2/i',
            '',
            $html
        );

        $html = preg_replace(
            '/\s(on\w+)\s*=\s*[^\s>]*/i',
            '',
            $html
        );

        $html = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $html);

        if (stripos($html, '<img') !== false) {
            $html = preg_replace_callback(
                '/<img\s+([^>]*?)>/i',
                function ($matches) {
                    $attrs = $matches[1];
                    $safeAttrs = '';
                    $allowedImgAttrs = ['src' => true, 'alt' => true, 'width' => true, 'height' => true, 'style' => true, 'title' => true];

                    preg_match_all('/(\w+)\s*=\s*(["\'])([^"\']*)\\2/i', $attrs, $attrMatches, PREG_SET_ORDER);

                    if (empty($attrMatches)) {
                        preg_match_all('/(\w+)\s*=\s*([^\s>]+)/i', $attrs, $attrMatches, PREG_SET_ORDER);
                    }

                    foreach ($attrMatches as $attr) {
                        $attrName = strtolower($attr[1]);
                        if (isset($allowedImgAttrs[$attrName])) {
                            $safeAttrs .= ' ' . $attr[0];
                        }
                    }

                    if (stripos($safeAttrs, 'src=') === false) {
                        return '';
                    }

                    return '<img' . $safeAttrs . '>';
                },
                $html
            );
        }

        if (stripos($html, '<a') !== false) {
            $html = preg_replace_callback(
                '/<a\s+([^>]*?)>/i',
                function ($matches) {
                    $attrs = $matches[1];
                    $href = '';

                    if (preg_match('/href\s*=\s*(["\'])([^"\']*)\\1/i', $attrs, $hrefMatch)) {
                        $href = $hrefMatch[2];

                        $isSafe = str_starts_with($href, 'https://')
                            || str_starts_with($href, 'http://')
                            || str_starts_with($href, 'mailto:')
                            || str_starts_with($href, '/')
                            || str_starts_with($href, '#');

                        if (!$isSafe) {
                            return '<a>';
                        }
                    }

                    return '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8') . '">';
                },
                $html
            );
        }

        return $html;
    }
}
