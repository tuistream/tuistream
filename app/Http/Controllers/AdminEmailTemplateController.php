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
            'subject' => $validated['subject'],
            'body' => $validated['body'],
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

        $template->update($validated);

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
}
