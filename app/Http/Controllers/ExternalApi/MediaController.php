<?php

namespace App\Http\Controllers\ExternalApi;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    private function scopedQuery()
    {
        return Media::query()->where('client_id', auth()->id());
    }

    public function index(): JsonResponse
    {
        Log::channel('external_api')->info('media.index', [
            'user_id' => auth()->id(),
            'ip'      => request()->ip(),
        ]);

        $filters = request()->only(['type', 'folder_id', 'search']);

        $media = $this->scopedQuery()
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['folder_id'] ?? null, fn ($q, $v) => $q->where('folder_id', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->with('folder:id,name')
            ->orderBy('title')
            ->paginate(50);

        return response()->json([
            'data'       => $media->items(),
            'pagination' => [
                'current_page' => $media->currentPage(),
                'last_page'    => $media->lastPage(),
                'per_page'     => $media->perPage(),
                'total'        => $media->total(),
            ],
        ]);
    }

    public function show(Media $media): JsonResponse
    {
        abort_unless($media->client_id === auth()->id(), 404);

        return response()->json(['data' => $media->load('folder:id,name')]);
    }
}
