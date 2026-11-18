<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/** { "read": false } pour remettre en non lu, { "archived": true } pour archiver. */
class UpdateContactMessageRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'read' => ['sometimes', 'boolean'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }
}
