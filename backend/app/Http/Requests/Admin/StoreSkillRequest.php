<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Skill;
use Illuminate\Validation\Rule;

class StoreSkillRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Skill|null $skill présent seulement en mise à jour */
        $skill = $this->route('skill');
        $categoryId = $this->input('skill_category_id', $skill?->skill_category_id);

        return [
            'skill_category_id' => ['required', 'integer', 'exists:skill_categories,id'],
            // Unique dans la catégorie (même règle que l'index unique en base).
            'name' => ['required', 'string', 'max:80', Rule::unique('skills', 'name')->where('skill_category_id', $categoryId)->ignore($skill)],
            'level' => ['required', 'integer', 'between:0,100'],
            'sort_order' => ['integer', 'min:0', 'max:32767'],
            'is_visible' => ['boolean'],
        ];
    }
}
