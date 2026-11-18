<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/** Envoi du CV, champ « file » d'un FormData : PDF uniquement, 5 Mo maximum. */
class UploadCvRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }
}
