<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

class UpdateSkillRequest extends StoreSkillRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return self::partial(parent::rules());
    }
}
