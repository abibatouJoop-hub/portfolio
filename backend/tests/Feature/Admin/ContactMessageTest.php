<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    public function test_index_filters_and_returns_unread_count(): void
    {
        ContactMessage::factory()->count(2)->create();
        ContactMessage::factory()->read()->create();
        ContactMessage::factory()->archived()->create();

        $this->getJson('/api/v1/admin/messages')
            ->assertOk()
            ->assertJsonCount(3, 'data')               // boîte de réception = non archivés
            ->assertJsonPath('meta.unread_count', 2)
            ->assertJsonPath('meta.total', 3);         // pagination

        $this->getJson('/api/v1/admin/messages?filter=unread')->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/admin/messages?filter=archived')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/messages?filter=all')->assertJsonCount(4, 'data');
    }

    public function test_index_lists_newest_first(): void
    {
        $old = ContactMessage::factory()->create(['created_at' => now()->subDay()]);
        $new = ContactMessage::factory()->create();

        $this->getJson('/api/v1/admin/messages')->assertJsonPath('data.*.id', [$new->id, $old->id]);
    }

    public function test_show_marks_message_as_read(): void
    {
        $message = ContactMessage::factory()->create();

        $this->getJson("/api/v1/admin/messages/{$message->id}")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);

        $this->assertNotNull($message->fresh()->read_at);
    }

    public function test_patch_marks_unread_and_archives(): void
    {
        $message = ContactMessage::factory()->read()->create();

        $this->patchJson("/api/v1/admin/messages/{$message->id}", ['read' => false])
            ->assertOk()
            ->assertJsonPath('data.is_read', false);

        $this->patchJson("/api/v1/admin/messages/{$message->id}", ['archived' => true])
            ->assertOk()
            ->assertJsonPath('data.is_archived', true);

        $this->patchJson("/api/v1/admin/messages/{$message->id}", ['archived' => 'peut-être'])
            ->assertUnprocessable();
    }

    public function test_destroy(): void
    {
        $message = ContactMessage::factory()->create();

        $this->deleteJson("/api/v1/admin/messages/{$message->id}")->assertNoContent();
        $this->assertModelMissing($message);
    }
}
