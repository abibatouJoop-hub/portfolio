<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/**
 * Nouvel ordre d'affichage : { "ids": [3, 1, 2] }.
 * Partagé par les projets et les compétences.
 */
class ReorderRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }
}
