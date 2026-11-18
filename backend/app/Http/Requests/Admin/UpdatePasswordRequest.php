<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends AdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Le mot de passe actuel est exigé : une session volée ne suffit pas à le changer.
            'current_password' => ['required', 'string', 'current_password'],
            // « confirmed » : il faut aussi envoyer password_confirmation identique.
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::defaults()],
        ];
    }
}
