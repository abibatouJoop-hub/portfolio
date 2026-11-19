<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * « Mot de passe oublié ? » avec le broker de Laravel (table password_reset_tokens) :
 * le jeton est stocké haché, expire au bout de 60 min et ne sert qu'une fois.
 */
class PasswordResetService
{
    /**
     * Envoie le lien de réinitialisation si un compte existe pour cet email.
     *
     * Ne renvoie rien exprès : que l'email existe ou non (ou qu'un lien ait déjà été
     * demandé il y a moins d'une minute), l'appelant répond la même chose. Un attaquant
     * ne peut donc pas savoir si une adresse correspond au compte admin.
     */
    public function sendResetLink(string $email): void
    {
        Password::broker()->sendResetLink(['email' => $email]);
    }

    /**
     * Change le mot de passe si le jeton est valide.
     *
     * @param  array{token: string, email: string, password: string}  $data
     * @return bool false si le jeton est invalide, expiré ou déjà utilisé
     */
    public function reset(array $data): bool
    {
        $status = Password::broker()->reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => $password,                 // haché par le cast « hashed »
                'remember_token' => Str::random(60),     // invalide les cookies « se souvenir de moi »
            ])->save();

            $this->logoutEverywhere($user);

            event(new PasswordReset($user));
        });

        return $status === Password::PASSWORD_RESET;
    }

    /**
     * Si quelqu'un avait volé une session, la réinitialisation doit l'en chasser :
     * on supprime toutes les sessions de l'utilisateur (driver « database »).
     */
    private function logoutEverywhere(User $user): void
    {
        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }
    }
}
