<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $query = Media::with('folder');

        // Admin sees all media; clients see only their own
        if (!auth()->user()->isAdmin()) {
            $query->where('client_id', auth()->id());
        }

        if ($request->folder_id) {
            $query->where('folder_id', $request->folder_id);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('original_name', 'like', "%{$request->search}%")
                  ->orWhere('filename', 'like', "%{$request->search}%");
            });
        }

        $folders = MediaFolder::where('parent_id', $request->folder_id)
            ->when(!auth()->user()->isAdmin(), fn ($q) => $q->where('client_id', auth()->id()))
            ->get();

        return response()->json([
            'media' => $query->paginate(50),
            'folders' => $folders,
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|max:524288', // 512MB
            'folder_id' => 'nullable|exists:media_folders,id',
        ]);

        $uploaded = [];

        foreach ($request->file('files', []) as $file) {
            $path = $file->store('media/' . auth()->id(), 'public');

            $media = Media::create([
                'filename' => basename($path),
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'type' => str_starts_with($file->getMimeType(), 'video/') ? 'video' : 'audio',
                'format' => $file->getClientOriginalExtension(),
                'size' => $file->getSize(),
                'folder_id' => $request->folder_id,
                'client_id' => auth()->id(),
                'uploaded_by' => auth()->id(),
            ]);

            $uploaded[] = $media;
        }

        return response()->json($uploaded, 201);
    }

    public function uploadChunk(Request $request)
    {
        // Chunked upload support for large files
        $request->validate([
            'file' => 'required|file',
            'chunk_index' => 'required|integer',
            'total_chunks' => 'required|integer',
            'original_name' => 'required|string',
            'folder_id' => 'nullable|exists:media_folders,id',
        ]);

        $tempDir = storage_path('app/temp/' . auth()->id());
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $chunk = $request->file('file');
        $chunkPath = $tempDir . '/' . $request->original_name . '.part' . $request->chunk_index;
        $chunk->move(dirname($chunkPath), basename($chunkPath));

        // If all chunks received, combine them
        if ($request->chunk_index == $request->total_chunks - 1) {
            $finalPath = 'media/' . auth()->id() . '/' . uniqid() . '_' . $request->original_name;
            $finalFullPath = storage_path('app/public/' . $finalPath);

            $out = fopen($finalFullPath, 'wb');
            for ($i = 0; $i < $request->total_chunks; $i++) {
                $partPath = $tempDir . '/' . $request->original_name . '.part' . $i;
                $in = fopen($partPath, 'rb');
                stream_copy_to_stream($in, $out);
                fclose($in);
                unlink($partPath);
            }
            fclose($out);

            $media = Media::create([
                'filename' => basename($finalPath),
                'original_name' => $request->original_name,
                'path' => $finalPath,
                'type' => 'audio', // Will be updated after ffprobe
                'format' => pathinfo($request->original_name, PATHINFO_EXTENSION),
                'size' => filesize($finalFullPath),
                'folder_id' => $request->folder_id,
                'client_id' => auth()->id(),
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json($media, 201);
        }

        return response()->json(['message' => "Chunk {$request->chunk_index} received"]);
    }

    public function destroy(Media $media)
    {
        // Security: Verify ownership unless admin
        if (!auth()->user()->isAdmin() && $media->client_id !== auth()->id()) {
            abort(404);
        }

        Storage::disk('public')->delete($media->path);
        $media->delete();
        return response()->json(null, 204);
    }

    public function createFolder(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_folders,id',
        ]);

        $folder = MediaFolder::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id,
            'client_id' => auth()->id(),
        ]);

        return response()->json($folder, 201);
    }
}
