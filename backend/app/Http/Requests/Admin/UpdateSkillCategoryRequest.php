<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

class UpdateSkillCategoryRequest extends StoreSkillCategoryRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return self::partial(parent::rules());
    }
}
