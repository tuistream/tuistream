<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();

            if ($user->is_suspended) {
                Auth::logout();
                
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'Tu cuenta ha sido suspendida.',
                ]);
            }

            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            // Audit log
            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            if ($user->isAdmin()) {
                return redirect()->intended(route('admin.dashboard'));
            }

            return redirect()->intended(route('client.dashboard'));
        }

        throw \Illuminate\Validation\ValidationException::withMessages([
            'email' => 'Las credenciales no coinciden.',
        ]);
    }

    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            \App\Models\AuditLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function impersonate(Request $request, \App\Models\User $user)
    {
        $admin = Auth::user();

        if (!$admin->isAdmin()) {
            abort(403);
        }

        // Store admin ID in session before switching
        session(['impersonated_by' => $admin->id]);

        // Log the impersonation
        \App\Models\AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'impersonate',
            'entity_type' => \App\Models\User::class,
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Login as the target user
        Auth::login($user);

        return redirect()->route('client.dashboard');
    }

    public function stopImpersonating(Request $request)
    {
        $adminId = session('impersonated_by');

        if (!$adminId) {
            return redirect()->route('client.dashboard');
        }

        $admin = \App\Models\User::find($adminId);

        if (!$admin) {
            session()->forget('impersonated_by');
            Auth::logout();
            return redirect('/login');
        }

        // Log the stop impersonation
        \App\Models\AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'stop_impersonate',
            'entity_type' => \App\Models\User::class,
            'entity_id' => Auth::id(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        session()->forget('impersonated_by');
        Auth::login($admin);

        return redirect()->route('admin.clients.index');
    }
}
