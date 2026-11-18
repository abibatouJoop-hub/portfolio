<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Experience;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Experience */
class ExperienceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'title' => $this->title,
            'organization' => $this->organization,
            'location' => $this->location,
            'start_date' => $this->start_date->toDateString(), // « 2024-09-01 »
            'end_date' => $this->end_date?->toDateString(),
            'is_current' => $this->is_current,
            'description' => $this->description,
            'technologies' => $this->whenLoaded('technologies', fn () => $this->technologies->pluck('name')),
            'sort_order' => $this->when($request->user() !== null, fn () => $this->sort_order),
        ];
    }
}
