<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/** Messages du formulaire de contact : envoi public et boîte de réception de l'admin. */
class ContactMessageService
{
    /** Filtres de la boîte de réception ; « inbox » par défaut. */
    public const FILTERS = ['inbox', 'unread', 'archived', 'all'];

    /**
     * Enregistre un message du formulaire public et prévient l'administratrice
     * (l'e-mail part en file d'attente via le listener SendContactNotification).
     *
     * @param  array{name: string, email: string, subject: string, body: string}  $data
     */
    public function submit(array $data, ?string $ipAddress): ContactMessage
    {
        $message = ContactMessage::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'body' => $data['body'],
            'ip_address' => $ipAddress,
        ]);

        ContactMessageReceived::dispatch($message);

        return $message;
    }

    /** @return LengthAwarePaginator<int, ContactMessage> */
    public function list(string $filter = 'inbox', int $perPage = 20): LengthAwarePaginator
    {
        $query = ContactMessage::query();

        match ($filter) {
            'unread' => $query->unread(),
            'archived' => $query->archived(),
            'all' => null,
            default => $query->inbox(),
        };

        return $query->latest()->latest('id')->paginate($perPage);
    }

    /** Ouvrir un message le marque comme lu. */
    public function open(ContactMessage $message): ContactMessage
    {
        if ($message->read_at === null) {
            $message->read_at = now();
            $message->save();
        }

        return $message;
    }

    /** @param  array{read?: mixed, archived?: mixed}  $data */
    public function update(ContactMessage $message, array $data): ContactMessage
    {
        if (array_key_exists('read', $data)) {
            $message->read_at = $this->bool($data['read']) ? ($message->read_at ?? now()) : null;
        }

        if (array_key_exists('archived', $data)) {
            $message->archived_at = $this->bool($data['archived']) ? ($message->archived_at ?? now()) : null;
        }

        $message->save();

        return $message;
    }

    public function delete(ContactMessage $message): void
    {
        $message->delete();
    }

    public function unreadCount(): int
    {
        return ContactMessage::query()->unread()->count();
    }

    /** La règle « boolean » accepte true, 1, "1", "0"… : on normalise. */
    private function bool(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
