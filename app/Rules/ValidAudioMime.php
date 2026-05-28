<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class ValidAudioMime implements ValidationRule
{
    private array $allowedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/mpeg3',
        'audio/x-mpeg-3',
        'audio/ogg',
        'audio/vorbis',
        'application/ogg',
        'audio/flac',
        'audio/x-flac',
        'audio/wav',
        'audio/wave',
        'audio/x-wav',
        'audio/mp4',
        'audio/x-m4a',
        'audio/aac',
        'video/mp4',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!($value instanceof UploadedFile)) {
            $fail('El archivo no es válido.');
            return;
        }

        $path = $value->getRealPath();

        if (!$path || !file_exists($path)) {
            $fail('No se pudo leer el archivo subido.');
            return;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($path);

        if (!$detectedMime || !in_array($detectedMime, $this->allowedMimeTypes, true)) {
            $fail("El tipo de archivo detectado '{$detectedMime}' no está permitido. Tipos válidos: audio (MP3, OGG, FLAC, WAV, M4A, AAC) o video (MP4).");
        }
    }
}
