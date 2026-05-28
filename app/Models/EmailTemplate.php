<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = [
        'name',
        'subject',
        'body',
        'type',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Reemplazar variables en el cuerpo del template.
     */
    public function render(array $data): array
    {
        $subject = $this->subject;
        $body = $this->body;

        foreach ($data as $key => $value) {
            $safeValue = htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
            $subject = str_replace('{{' . $key . '}}', $safeValue, $subject);
            $body = str_replace('{{' . $key . '}}', $safeValue, $body);
        }

        $body = preg_replace('/<script\b[^>]*>.*?<\/script>/is', '', $body);
        $body = preg_replace('/\s(on\w+)\s*=\s*(["\']?)[^"\'>]*\\2/i', '', $body);
        $body = preg_replace('/javascript\s*:/i', 'blocked:', $body);

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }
}
