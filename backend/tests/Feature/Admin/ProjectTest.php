<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProjectTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): static
    {
        return $this->actingAs(User::factory()->create());
    }

    /** @return array<string, array{string, string}> */
    public static function adminRoutes(): array
    {
        return [
            'liste' => ['GET', '/api/v1/admin/projects'],
            'création' => ['POST', '/api/v1/admin/projects'],
            'détail' => ['GET', '/api/v1/admin/projects/1'],
            'mise à jour' => ['PUT', '/api/v1/admin/projects/1'],
            'suppression' => ['DELETE', '/api/v1/admin/projects/1'],
            'réordonner' => ['PATCH', '/api/v1/admin/projects/reorder'],
        ];
    }

    #[DataProvider('adminRoutes')]
    public function test_guest_gets_401(string $method, string $uri): void
    {
        Project::factory()->create();

        $this->json($method, $uri)->assertUnauthorized();
    }

    public function test_guest_gets_json_401_even_without_accept_header(): void
    {
        $this->get('/api/v1/admin/projects')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_index_includes_drafts_and_exposes_status(): void
    {
        Project::factory()->create();
        Project::factory()->draft()->create();

        $this->admin()->getJson('/api/v1/admin/projects')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [['status', 'sort_order']]]);

        $this->admin()->getJson('/api/v1/admin/projects?status=draft')
            ->assertJsonCount(1, 'data');
    }

    public function test_store_creates_project_with_slug_technologies_and_publication_date(): void
    {
        $response = $this->admin()->postJson('/api/v1/admin/projects', [
            'title' => 'Mon Super Projet',
            'summary' => 'Un résumé.',
            'category' => 'web',
            'status' => 'published',
            'technologies' => ['Laravel', 'Angular'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.slug', 'mon-super-projet')
            ->assertJsonPath('data.status', 'published')
            ->assertJsonPath('data.technologies', ['Angular', 'Laravel']);
        $this->assertNotNull($response->json('data.published_at'));
    }

    public function test_store_rejects_invalid_data_with_422(): void
    {
        $this->admin()->postJson('/api/v1/admin/projects', [
            'title' => '',
            'category' => 'jeu-video',
            'status' => 'online',
            'demo_url' => 'pas-une-url',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'summary', 'category', 'status', 'demo_url']);
    }

    public function test_update_is_partial_and_keeps_the_slug(): void
    {
        $project = Project::factory()->draft()->create(['slug' => 'ancien-titre', 'summary' => 'Résumé conservé']);

        $this->admin()->putJson("/api/v1/admin/projects/{$project->id}", ['title' => 'Nouveau titre'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Nouveau titre')
            ->assertJsonPath('data.slug', 'ancien-titre')
            ->assertJsonPath('data.summary', 'Résumé conservé');
    }

    public function test_publishing_a_draft_makes_it_visible_on_the_public_site(): void
    {
        $project = Project::factory()->draft()->create(['slug' => 'bientot']);
        $this->getJson('/api/v1/projects')->assertJsonCount(0, 'data'); // met la liste en cache

        $this->admin()->putJson("/api/v1/admin/projects/{$project->id}", ['status' => 'published'])
            ->assertOk();

        // Le cache a été vidé : le projet apparaît tout de suite.
        $this->getJson('/api/v1/projects')->assertJsonCount(1, 'data');
    }

    public function test_destroy_soft_deletes(): void
    {
        $project = Project::factory()->create();

        $this->admin()->deleteJson("/api/v1/admin/projects/{$project->id}")->assertNoContent();

        $this->assertSoftDeleted($project);
        $this->getJson('/api/v1/projects')->assertJsonCount(0, 'data');
    }

    public function test_reorder_updates_sort_order(): void
    {
        [$a, $b, $c] = Project::factory()->count(3)->create();

        $this->admin()->patchJson('/api/v1/admin/projects/reorder', ['ids' => [$c->id, $a->id, $b->id]])
            ->assertNoContent();

        $this->getJson('/api/v1/projects')
            ->assertJsonPath('data.*.id', [$c->id, $a->id, $b->id]);
    }

    public function test_reorder_requires_a_list_of_distinct_ids(): void
    {
        $this->admin()->patchJson('/api/v1/admin/projects/reorder', ['ids' => [1, 1]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['ids.0']);
    }
}
