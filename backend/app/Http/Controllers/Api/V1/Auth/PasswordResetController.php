<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Services\PasswordResetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function __construct(private readonly PasswordResetService $passwords) {}

    /** POST /api/v1/auth/forgot-password  { email } */
    public function forgot(ForgotPasswordRequest $request): JsonResponse
    {
        $this->passwords->sendResetLink($request->validated('email'));

        // Toujours la même réponse, que l'adresse existe ou non.
        return response()->json([
            'message' => 'Si un compte correspond à cette adresse, un lien de réinitialisation vient d\'être envoyé.',
        ]);
    }

    /** POST /api/v1/auth/reset-password  { token, email, password, password_confirmation } */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        if (! $this->passwords->reset($request->validated())) {
            throw ValidationException::withMessages([
                'email' => 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.',
            ]);
        }

        return response()->json([
            'message' => 'Votre mot de passe a été modifié. Vous pouvez vous connecter.',
        ]);
    }
}
