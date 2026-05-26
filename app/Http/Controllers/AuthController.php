<?php

namespace App\Http\Controllers;

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

        return Inertia::render('Auth/Login');
    }

    /**
     * Procesar la autenticación de usuario.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            
            return redirect()->intended($this->getDashboardRoute())
                ->with('success', '¡Bienvenido de vuelta a TuiStream!');
        }

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
}
