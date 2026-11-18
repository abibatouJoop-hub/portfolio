<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Skill */
class SkillResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() !== null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'level' => $this->level,

            'skill_category_id' => $this->when($isAdmin, fn () => $this->skill_category_id),
            'sort_order' => $this->when($isAdmin, fn () => $this->sort_order),
            'is_visible' => $this->when($isAdmin, fn () => $this->is_visible),
        ];
    }
}
