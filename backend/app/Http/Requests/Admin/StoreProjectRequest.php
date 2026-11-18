<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::enum(ProjectCategory::class)],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'is_featured' => ['boolean'],
            'demo_url' => ['nullable', 'url', 'max:255'],
            'repo_url' => ['nullable', 'url', 'max:255'],
            'sort_order' => ['integer', 'min:0', 'max:32767'],
            'technologies' => ['array', 'max:20'],
            'technologies.*' => ['string', 'max:50'],
        ];
    }
}
