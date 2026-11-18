<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Authentification Sanctum en mode SPA : la session (cookie HttpOnly) porte la connexion.
 * Aucun jeton n'est renvoyé au navigateur.
 */
class AuthController extends Controller
{
    /** POST /api/v1/auth/login  { email, password, remember? } */
    public function login(LoginRequest $request): UserResource
    {
        if (! Auth::guard('web')->attempt($request->credentials(), $request->boolean('remember'))) {
            // Message volontairement vague : on ne dit pas si c'est l'email ou le mot de passe qui est faux.
            throw ValidationException::withMessages(['email' => 'Identifiants incorrects.']);
        }

        // Nouvel identifiant de session après connexion (protection contre la fixation de session).
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return UserResource::make(Auth::guard('web')->user());
    }

    /** POST /api/v1/auth/logout */
    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();      // détruit la session
            $request->session()->regenerateToken(); // nouveau jeton CSRF
        }

        return response()->noContent();
    }

    /** GET /api/v1/auth/me — Angular s'en sert pour savoir si l'admin est connectée */
    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    /** PUT /api/v1/admin/password  { current_password, password, password_confirmation } */
    public function updatePassword(UpdatePasswordRequest $request): Response
    {
        $request->user()->update(['password' => $request->validated('password')]); // haché par le cast "hashed"

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->noContent();
    }
}
