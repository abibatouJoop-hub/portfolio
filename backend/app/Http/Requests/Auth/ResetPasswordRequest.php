<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/** Nouveau mot de passe depuis le lien reçu par e-mail : { token, email, password, password_confirmation } */
class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route publique : c'est le jeton qui prouve l'identité
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ];
    }
}
