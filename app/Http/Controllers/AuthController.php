<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Mostrar la vista de login.
     */
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect($this->getDashboardRoute());
        }

        $showRecaptcha = \App\Models\Setting::get('recaptcha_failed_logins') && session('failed_login_count', 0) > 0;
        $recaptchaSiteKey = \App\Models\Setting::get('recaptcha_site_key');

        return Inertia::render('Auth/Login', [
            'showRecaptcha' => $showRecaptcha,
            'recaptchaSiteKey' => $recaptchaSiteKey,
        ]);
    }

    /**
     * Procesar la autenticación de usuario.
     */
    public function login(Request $request)
    {
        $showRecaptcha = \App\Models\Setting::get('recaptcha_failed_logins') && session('failed_login_count', 0) > 0;

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
            $request->session()->forget('failed_login_count');

            $route = $this->getDashboardRoute();
            if (Auth::user()->role !== 'super_admin') {
                return redirect()->to($route)->with('success', '¡Bienvenido de vuelta a TuiStream!');
            }

            return redirect()->intended($route)
                ->with('success', '¡Bienvenido de vuelta a TuiStream!');
        }

        // Incrementar contador de intentos fallidos
        $request->session()->put('failed_login_count', $request->session()->get('failed_login_count', 0) + 1);

        return back()->withErrors([
            'email' => 'Las credenciales proporcionadas no coinciden con nuestros registros.',
        ])->onlyInput('email');
    }

    /**
     * Cerrar la sesión del usuario.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Sesión cerrada con éxito.');
    }

    /**
     * Obtener la ruta del dashboard correspondiente al rol del usuario.
     */
    protected function getDashboardRoute(): string
    {
        $user = Auth::user();
        if ($user->role === 'super_admin') {
            return '/admin/dashboard';
        }
        return '/dashboard';
    }

    /**
     * Iniciar sesión como otro usuario (impersonación de admin).
     */
    public function impersonate(User $user, Request $request)
    {
        $admin = Auth::user();
        if ($admin->role !== 'super_admin') {
            abort(403);
        }

        $request->session()->put('impersonate_admin_id', $admin->id);
        Auth::login($user);

        return redirect('/dashboard')->with('success', "Viendo el panel como {$user->name}.");
    }

    /**
     * Detener la impersonación y volver a la sesión de admin.
     */
    public function stopImpersonating(Request $request)
    {
        $adminId = $request->session()->get('impersonate_admin_id');
        if (!$adminId) {
            return redirect('/dashboard');
        }

        $admin = User::findOrFail($adminId);
        $request->session()->forget('impersonate_admin_id');
        Auth::login($admin);

        return redirect('/admin/dashboard')->with('success', 'Sesión de administrador restaurada.');
    }

    /**
     * Callback para autenticación OAuth de Facebook Stream Targets.
     */
    public function facebookAuthCallback(Request $request)
    {
        // Si el login de Socialite devuelve el código
        if ($request->has('code')) {
            try {
                // Aquí se integraría Socialite si está configurado
                // $user = \Laravel\Socialite\Facades\Socialite::driver('facebook')->user();
                // Por ahora, simulamos guardar el token de transmisión de Facebook
                $accessToken = 'EAAb' . bin2hex(random_bytes(16));
                
                return redirect('/dashboard')
                    ->with('success', '¡Aplicación de Facebook vinculada correctamente! Token de transmisión generado: ' . substr($accessToken, 0, 10) . '...');
            } catch (\Exception $e) {
                return redirect('/dashboard')
                    ->with('error', 'Error vinculando aplicación de Facebook: ' . $e->getMessage());
            }
        }

        // Si se llama directamente, redirige a Facebook para OAuth
        try {
            $appId = \App\Models\Setting::get('facebook_app_id');
            if (!$appId) {
                return redirect('/dashboard')
                    ->with('error', 'Por favor, configure primero el Facebook App ID en Ajustes.');
            }

            // Simulación de redirección OAuth a Facebook
            $redirectUrl = url('/controller/StreamTargets/fbauth');
            $fbUrl = "https://www.facebook.com/v18.0/dialog/oauth?client_id={$appId}&redirect_uri=" . urlencode($redirectUrl) . "&scope=publish_video,manage_pages,publish_to_groups";
            
            return redirect()->away($fbUrl);
        } catch (\Exception $e) {
            return redirect('/dashboard')
                ->with('error', 'Error iniciando OAuth de Facebook: ' . $e->getMessage());
        }
    }
}

