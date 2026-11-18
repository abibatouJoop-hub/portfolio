<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/** E-mail envoyé à l'administratrice quand un visiteur écrit via le formulaire. */
class NewContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactMessage $contactMessage) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Portfolio — nouveau message : '.$this->contactMessage->subject,
            // « Répondre » dans la messagerie écrit directement au visiteur.
            replyTo: [new Address($this->contactMessage->email, $this->contactMessage->name)],
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.new-contact-message',
            with: ['adminUrl' => rtrim((string) config('portfolio.frontend_url'), '/').'/admin/messages/'.$this->contactMessage->id],
        );
    }
}
