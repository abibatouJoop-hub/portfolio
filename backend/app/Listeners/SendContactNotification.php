<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ContactMessageReceived;
use App\Mail\NewContactMessageMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

/**
 * ShouldQueue : le listener n'est pas exécuté pendant la requête du visiteur,
 * il est mis dans la file d'attente (table jobs) et traité par `php artisan queue:work`.
 * Le visiteur reçoit sa réponse tout de suite, même si le serveur mail est lent.
 */
class SendContactNotification implements ShouldQueue
{
    /** Nombre d'essais si l'envoi échoue (serveur mail indisponible…). */
    public int $tries = 3;

    /** Attente (en secondes) entre deux essais. */
    public int $backoff = 60;

    public function handle(ContactMessageReceived $event): void
    {
        $recipient = config('portfolio.contact.notification_email');

        if (blank($recipient)) {
            return; // aucune adresse configurée : le message reste visible dans l'admin
        }

        Mail::to($recipient)->send(new NewContactMessageMail($event->message));
    }
}
