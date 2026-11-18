<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ExperienceType;
use Illuminate\Validation\Rule;

class StoreExperienceRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ExperienceType::class)],
            'title' => ['required', 'string', 'max:150'],
            'organization' => ['required', 'string', 'max:150'],
            'location' => ['nullable', 'string', 'max:120'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['boolean'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['integer', 'min:0', 'max:32767'],
            'technologies' => ['array', 'max:20'],
            'technologies.*' => ['string', 'max:50'],
        ];
    }
}
