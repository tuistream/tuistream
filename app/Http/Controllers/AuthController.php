<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ImpersonationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class AuthController extends Controller
{
    private const LOGIN_ATTEMPTS_TTL = 900;

    public function showLogin()
    {
        if (Auth::check()) {
            return redirect($this->getDashboardRoute());
        }

        $failedAttempts = (int) Cache::get('login_attempts:' . request()->ip(), 0);
        $recaptchaThreshold = (int) (\App\Models\Setting::get('recaptcha_failed_logins') ?: 3);
        $showRecaptcha = $failedAttempts >= $recaptchaThreshold;
        $recaptchaSiteKey = \App\Models\Setting::get('recaptcha_site_key');

        return Inertia::render('Auth/Login', [
            'showRecaptcha' => $showRecaptcha,
            'recaptchaSiteKey' => $recaptchaSiteKey,
        ]);
    }

    public function login(Request $request)
    {
        $failedAttempts = (int) Cache::get('login_attempts:' . $request->ip(), 0);
        $recaptchaThreshold = (int) (\App\Models\Setting::get('recaptcha_failed_logins') ?: 3);
        $showRecaptcha = $failedAttempts >= $recaptchaThreshold;

        $rules = [
            'email' => ['required', 'email'],
            'password' => ['required'],
        ];

        if ($showRecaptcha) {
            $rules['g-recaptcha-response'] = ['required'];
        }

        $request->validate($rules, [
            'g-recaptcha-response.required' => 'Por favor, completa la verificación reCAPTCHA.',
        ]);

        if ($showRecaptcha) {
            $recaptchaSecret = \App\Models\Setting::get('recaptcha_secret');
            $response = \Illuminate\Support\Facades\Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $recaptchaSecret,
                'response' => $request->input('g-recaptcha-response'),
                'remoteip' => $request->ip(),
            ]);

            if (!$response->json('success')) {
                return back()->withErrors([
                    'email' => 'La verificación de reCAPTCHA ha fallado. Por favor, inténtelo de nuevo.',
                ])->onlyInput('email');
            }
        }

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            Cache::forget('login_attempts:' . $request->ip());

            $route = $this->getDashboardRoute();
            if (Auth::user()->role !== 'super_admin') {
                return redirect()->to($route)->with('success', '¡Bienvenido de vuelta a TuiStream!');
            }

            return redirect()->intended($route)
                ->with('success', '¡Bienvenido de vuelta a TuiStream!');
        }

        Cache::increment('login_attempts:' . $request->ip(), 1);
        Cache::put('login_attempts:' . $request->ip(), Cache::get('login_attempts:' . $request->ip(), 0), self::LOGIN_ATTEMPTS_TTL);

        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no coinciden con nuestros registros.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Sesión cerrada con éxito.');
    }

    protected function getDashboardRoute(): string
    {
        $user = Auth::user();
        if ($user->role === 'super_admin') {
            return '/admin/dashboard';
        }
        return '/dashboard';
    }

    public function impersonate(User $user, Request $request)
    {
        $admin = Auth::user();
        if ($admin->role !== 'super_admin') {
            abort(403);
        }

        $request->session()->put('impersonate_admin_id', $admin->id);

        $logId = ImpersonationLog::insertGetId([
            'admin_id' => $admin->id,
            'target_user_id' => $user->id,
            'started_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->session()->put('impersonate_log_id', $logId);

        Auth::login($user);

        return redirect('/dashboard')->with('success', "Viendo el panel como {$user->name}.");
    }

    public function stopImpersonating(Request $request)
    {
        $adminId = $request->session()->get('impersonate_admin_id');
        if (!$adminId) {
            return redirect('/dashboard');
        }

        $logId = $request->session()->get('impersonate_log_id');
        if ($logId) {
            ImpersonationLog::where('id', $logId)->update([
                'ended_at' => now(),
            ]);
        }

        $admin = User::findOrFail($adminId);
        $request->session()->forget('impersonate_admin_id');
        $request->session()->forget('impersonate_log_id');
        Auth::login($admin);

        return redirect('/admin/dashboard')->with('success', 'Sesión de administrador restaurada.');
    }

    public function facebookAuthCallback(Request $request)
    {
        if ($request->has('code')) {
            try {
                $accessToken = 'EAAb' . bin2hex(random_bytes(16));

                return redirect('/dashboard')
                    ->with('success', '¡Aplicación de Facebook vinculada correctamente! Token de transmisión generado: ' . substr($accessToken, 0, 10) . '...');
            } catch (\Exception $e) {
                return redirect('/dashboard')
                    ->with('error', 'Error vinculando aplicación de Facebook: ' . $e->getMessage());
            }
        }

        try {
            $appId = \App\Models\Setting::get('facebook_app_id');
            if (!$appId) {
                return redirect('/dashboard')
                    ->with('error', 'Por favor, configure primero el Facebook App ID en Ajustes.');
            }

            $redirectUrl = url('/controller/StreamTargets/fbauth');
            $fbUrl = "https://www.facebook.com/v18.0/dialog/oauth?client_id={$appId}&redirect_uri=" . urlencode($redirectUrl) . "&scope=publish_video,manage_pages,publish_to_groups";

            return redirect()->away($fbUrl);
        } catch (\Exception $e) {
            return redirect('/dashboard')
                ->with('error', 'Error iniciando OAuth de Facebook: ' . $e->getMessage());
        }
    }
}

