<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SyncController extends Controller
{
    /**
     * Estado de la sincronización del cliente.
     */
    public function status(): JsonResponse
    {
        $userId = auth()->id();

        Log::channel('external_api')->info('sync.status', [
            'user_id' => $userId,
            'ip'      => request()->ip(),
        ]);

        return response()->json([
            'data' => [
                'client_id'  => $userId,
                'connected_at' => now()->toIso8601String(),
                'last_sync'    => \App\Models\AuditLog::where('user_id', $userId)
                    ->where('action', 'like', 'external_api.%')
                    ->latest()
                    ->value('created_at'),
            ],
        ]);
    }

    /**
     * Recibir eventos del sistema externo (webhook).
     */
    public function receiveEvent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event'       => 'required|string|max:255',
            'payload'     => 'required|array',
            'timestamp'   => 'nullable|string',
        ]);

        Log::channel('external_api')->info('sync.event_received', [
            'user_id' => auth()->id(),
            'event'   => $data['event'],
            'payload' => $data['payload'],
        ]);

        // Registrar en auditoría
        \App\Models\AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => 'external_api.event.' . $data['event'],
            'details'    => json_encode($data['payload']),
            'ip_address' => request()->ip(),
        ]);

        return response()->json([
            'message' => 'Evento recibido correctamente.',
            'event'   => $data['event'],
            'received_at' => now()->toIso8601String(),
        ], 201);
    }
}
