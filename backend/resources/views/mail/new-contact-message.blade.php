<x-mail::message>
# Nouveau message depuis le portfolio

**De :** {{ $contactMessage->name }} ({{ $contactMessage->email }})
**Sujet :** {{ $contactMessage->subject }}
**Reçu le :** {{ $contactMessage->created_at?->format('d/m/Y à H:i') }}

<x-mail::panel>
{!! nl2br(e($contactMessage->body)) !!}
</x-mail::panel>

Répondez directement à cet e-mail pour écrire à {{ $contactMessage->name }}.

<x-mail::button :url="$adminUrl">
Voir dans l'admin
</x-mail::button>
</x-mail::message>
