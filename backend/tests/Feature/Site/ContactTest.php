<?php

declare(strict_types=1);

namespace Tests\Feature\Site;

use App\Events\ContactMessageReceived;
use App\Listeners\SendContactNotification;
use App\Mail\NewContactMessageMail;
use App\Models\ContactMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    /** @param  array<string, mixed>  $overrides */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Awa Ndiaye',
            'email' => 'awa@example.com',
            'subject' => 'Proposition de mission',
            'body' => "Bonjour,\nJ'aimerais discuter d'un projet Laravel.",
            ...$overrides,
        ];
    }

    public function test_stores_the_message_with_ip_and_dispatches_the_event(): void
    {
        Event::fake([ContactMessageReceived::class]);

        $this->postJson('/api/v1/contact', $this->payload(), ['REMOTE_ADDR' => '203.0.113.7'])
            ->assertCreated()
            ->assertExactJson(['message' => 'Merci, votre message a bien été envoyé.']);

        $message = ContactMessage::sole();
        $this->assertSame('Awa Ndiaye', $message->name);
        $this->assertSame('203.0.113.7', $message->ip_address);
        $this->assertNull($message->read_at);

        Event::assertDispatched(ContactMessageReceived::class, fn ($e) => $e->message->is($message));
    }

    public function test_the_email_is_queued_not_sent_during_the_request(): void
    {
        Queue::fake();

        $this->postJson('/api/v1/contact', $this->payload())->assertCreated();

        $this->assertContains(ShouldQueue::class, class_implements(SendContactNotification::class));
        Queue::assertPushed(CallQueuedListener::class, fn ($job) => $job->class === SendContactNotification::class);
    }

    public function test_honeypot_field_blocks_bots(): void
    {
        Event::fake();

        $this->postJson('/api/v1/contact', $this->payload(['website' => 'http://spam.example']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('website');

        $this->assertDatabaseCount('contact_messages', 0);
        Event::assertNotDispatched(ContactMessageReceived::class);
    }

    public function test_validation(): void
    {
        $this->postJson('/api/v1/contact', ['email' => 'pas-un-email', 'body' => 'court'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'subject', 'body']);
    }

    public function test_limited_to_5_messages_per_hour_per_ip(): void
    {
        Event::fake();

        foreach (range(1, 5) as $i) {
            $this->postJson('/api/v1/contact', $this->payload())->assertCreated();
        }

        $this->postJson('/api/v1/contact', $this->payload())->assertTooManyRequests();
        $this->assertDatabaseCount('contact_messages', 5);
    }

    public function test_listener_emails_the_admin_with_reply_to_the_visitor(): void
    {
        Mail::fake();
        config(['portfolio.contact.notification_email' => 'admin@example.com']);
        $message = ContactMessage::factory()->create(['email' => 'awa@example.com', 'name' => 'Awa']);

        (new SendContactNotification)->handle(new ContactMessageReceived($message));

        Mail::assertSent(NewContactMessageMail::class, fn (NewContactMessageMail $mail) => $mail->hasTo('admin@example.com')
            && $mail->hasReplyTo('awa@example.com'));
    }

    public function test_email_content_escapes_html(): void
    {
        $message = ContactMessage::factory()->create([
            'subject' => 'Question',
            'body' => "Ligne 1\n<script>alert('xss')</script>",
        ]);

        $mail = new NewContactMessageMail($message);

        $mail->assertHasSubject('Portfolio — nouveau message : Question');
        $mail->assertSeeInHtml('Ligne 1<br>', false);                     // retours à la ligne conservés
        $mail->assertSeeInHtml('&lt;script&gt;', false);                   // HTML du visiteur échappé…
        $mail->assertDontSeeInHtml("<script>alert('xss')</script>", false); // … donc jamais exécuté
        $mail->assertSeeInHtml("/admin/messages/{$message->id}");
    }
}
