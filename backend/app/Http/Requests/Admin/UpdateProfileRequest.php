<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

/**
 * Mise à jour partielle du profil et, si « social_links » est envoyé,
 * remplacement complet de la liste des réseaux (dans l'ordre reçu).
 */
class UpdateProfileRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:80'],
            'last_name' => ['sometimes', 'required', 'string', 'max:80'],
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'hero_title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'hero_subtitle' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'main_stack' => ['sometimes', 'nullable', 'string', 'max:150'],
            'about_title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'about_text' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:150'],
            'education' => ['sometimes', 'nullable', 'string', 'max:150'],
            'languages' => ['sometimes', 'array', 'max:10'],
            'languages.*' => ['string', 'max:50'],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'is_available' => ['sometimes', 'boolean'],

            'social_links' => ['sometimes', 'array', 'max:10'],
            'social_links.*.platform' => ['required', 'string', 'alpha_dash', 'max:30', 'distinct:ignore_case'],
            'social_links.*.url' => ['required', 'url', 'max:255'],
        ];
    }
}
