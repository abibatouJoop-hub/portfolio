<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class StoreSkillCategoryRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80', Rule::unique('skill_categories', 'name')->ignore($this->route('skill_category'))],
            'sort_order' => ['integer', 'min:0', 'max:32767'],
        ];
    }
}
