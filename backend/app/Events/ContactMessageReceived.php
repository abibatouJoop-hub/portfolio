<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\ContactMessage;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * « Un message vient d'arriver. » L'événement ne fait rien lui-même :
 * il prévient les listeners (aujourd'hui l'e-mail, demain pourquoi pas une notification Slack).
 */
class ContactMessageReceived
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly ContactMessage $message) {}
}
