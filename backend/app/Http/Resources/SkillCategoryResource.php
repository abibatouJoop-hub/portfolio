<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SkillCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SkillCategory */
class SkillCategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sort_order' => $this->when($request->user() !== null, fn () => $this->sort_order),
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
        ];
    }
}
