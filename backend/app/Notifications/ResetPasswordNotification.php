<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * E-mail « Réinitialiser votre mot de passe », en français, envoyé en file d'attente.
 * Le lien pointe vers la page Angular (et non vers une page Laravel, l'API n'en a pas).
 */
class ResetPasswordNotification extends ResetPassword implements ShouldQueue
{
    use Queueable;

    /** Lien vers le front : {FRONTEND_URL}/admin/reset-password?token=…&email=… */
    protected function resetUrl($notifiable): string
    {
        $base = rtrim((string) config('portfolio.frontend_url'), '/').config('portfolio.password_reset_path');

        return $base.'?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }

    public function toMail($notifiable): MailMessage
    {
        $minutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Portfolio — réinitialisation du mot de passe')
            ->greeting('Bonjour,')
            ->line('Vous recevez cet e-mail car une réinitialisation du mot de passe de l\'espace admin a été demandée.')
            ->action('Choisir un nouveau mot de passe', $this->resetUrl($notifiable))
            ->line("Ce lien expire dans {$minutes} minutes et ne peut servir qu'une fois.")
            ->line('Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet e-mail : votre mot de passe actuel reste valable.')
            ->salutation('— Portfolio');
    }
}
