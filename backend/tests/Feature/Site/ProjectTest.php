<?php

declare(strict_types=1);

namespace Tests\Feature\Site;

use App\Enums\ProjectCategory;
use App\Models\Project;
use App\Models\Technology;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_only_published_projects_in_display_order(): void
    {
        $second = Project::factory()->create(['sort_order' => 2]);
        $first = Project::factory()->create(['sort_order' => 1]);
        Project::factory()->draft()->create();
        Project::factory()->create()->delete();

        $this->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('data.1.id', $second->id);
    }

    public function test_filters_by_category(): void
    {
        Project::factory()->create(['category' => ProjectCategory::Web]);
        $api = Project::factory()->create(['category' => ProjectCategory::Api]);

        $this->getJson('/api/v1/projects?category=api')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $api->id);
    }

    public function test_public_json_hides_admin_fields(): void
    {
        $project = Project::factory()->create();
        $project->technologies()->attach(Technology::factory()->create(['name' => 'Laravel', 'slug' => 'laravel']));

        $this->getJson('/api/v1/projects')
            ->assertJsonPath('data.0.technologies', ['Laravel'])
            ->assertJsonMissingPath('data.0.status')
            ->assertJsonMissingPath('data.0.sort_order');
    }

    public function test_shows_a_published_project_by_slug(): void
    {
        Project::factory()->create(['slug' => 'mon-projet', 'title' => 'Mon projet']);

        $this->getJson('/api/v1/projects/mon-projet')
            ->assertOk()
            ->assertJsonPath('data.title', 'Mon projet');
    }

    public function test_draft_and_deleted_projects_are_not_found(): void
    {
        Project::factory()->draft()->create(['slug' => 'brouillon']);
        Project::factory()->create(['slug' => 'supprime'])->delete();

        $this->getJson('/api/v1/projects/brouillon')->assertNotFound();
        $this->getJson('/api/v1/projects/supprime')->assertNotFound();
        $this->getJson('/api/v1/projects/inexistant')->assertNotFound();
    }
}
