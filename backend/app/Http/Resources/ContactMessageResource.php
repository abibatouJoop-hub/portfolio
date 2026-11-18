<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Uniquement utilisé dans l'admin. @mixin ContactMessage */
class ContactMessageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'subject' => $this->subject,
            'body' => $this->body,
            'is_read' => $this->read_at !== null,
            'is_archived' => $this->archived_at !== null,
            'read_at' => $this->read_at?->toIso8601String(),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
