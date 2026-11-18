<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ContactMessageFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Message reçu via le formulaire de contact.
 * Table contact_messages (et non messages) pour éviter la confusion avec les notifications Laravel.
 */
class ContactMessage extends Model
{
    /** @use HasFactory<ContactMessageFactory> */
    use HasFactory;

    protected $fillable = ['name', 'email', 'subject', 'body', 'ip_address', 'read_at', 'archived_at'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /** Boîte de réception : tout ce qui n'est pas archivé. */
    public function scopeInbox(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at')->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): void
    {
        $query->whereNotNull('archived_at');
    }
}
