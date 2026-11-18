<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\ContactMessage;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_counters_latest_messages_and_recent_changes(): void
    {
        Project::factory()->count(2)->create(['updated_at' => now()->subDays(3)]);
        Project::factory()->draft()->create(['title' => 'Dernier modifié', 'updated_at' => now()]);
        Skill::factory()->count(3)->create(['updated_at' => now()->subDays(5)]);
        Experience::factory()->create(['updated_at' => now()->subDay()]);
        ContactMessage::factory()->count(2)->create();
        ContactMessage::factory()->read()->create();
        ContactMessage::factory()->archived()->create();

        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.counters', [
                'projects_published' => 2,
                'projects_draft' => 1,
                'skills' => 3,
                'experiences' => 1,
                'messages_unread' => 2,
                'messages_inbox' => 3,
            ])
            ->assertJsonCount(3, 'data.latest_messages')
            ->assertJsonCount(5, 'data.recent_changes')
            ->assertJsonPath('data.recent_changes.0.label', 'Dernier modifié')
            ->assertJsonPath('data.recent_changes.0.type', 'project')
            ->assertJsonPath('data.recent_changes.1.type', 'experience');
    }
}
