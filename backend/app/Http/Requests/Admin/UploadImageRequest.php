<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/**
 * Envoi d'une image (couverture de projet, photo de profil), champ « file » d'un FormData.
 * Le SVG est volontairement exclu : il peut contenir du JavaScript (faille XSS).
 */
class UploadImageRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048', // en kilo-octets → 2 Mo
                'dimensions:max_width=6000,max_height=6000',
            ],
        ];
    }
}
