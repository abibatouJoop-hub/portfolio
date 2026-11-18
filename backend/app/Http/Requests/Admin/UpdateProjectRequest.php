<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/** Mêmes règles que la création, en mise à jour partielle. */
class UpdateProjectRequest extends StoreProjectRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return self::partial(parent::rules());
    }
}
