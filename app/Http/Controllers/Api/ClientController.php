<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClientController extends Controller
{
    public function index()
    {
        return User::role('client')->paginate(25);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'timezone' => 'nullable|string',
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);
        $user->assignRole('client');

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user->load('stations', 'channels');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:8',
            'timezone' => 'nullable|string',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }

    public function suspend(User $user)
    {
        $user->update([
            'is_suspended' => true,
            'suspended_at' => now(),
            'suspended_reason' => request('reason'),
        ]);

        return response()->json(['message' => 'Client suspended']);
    }

    public function unsuspend(User $user)
    {
        $user->update([
            'is_suspended' => false,
            'suspended_at' => null,
            'suspended_reason' => null,
        ]);

        return response()->json(['message' => 'Client unsuspended']);
    }
}
