<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\Technology;
use App\Services\ProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProjectServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProjectService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ProjectService::class);
    }

    /** @param  array<string, mixed>  $overrides */
    private function data(array $overrides = []): array
    {
        return [
            'title' => 'Portfolio',
            'summary' => 'Résumé',
            'category' => 'web',
            'status' => 'draft',
            ...$overrides,
        ];
    }

    public function test_slug_is_unique_even_against_soft_deleted_projects(): void
    {
        $this->service->create($this->data())->delete();

        $this->assertSame('portfolio-2', $this->service->create($this->data())->slug);
        $this->assertSame('portfolio-3', $this->service->create($this->data())->slug);
    }

    public function test_draft_has_no_publication_date(): void
    {
        $this->assertNull($this->service->create($this->data())->published_at);
    }

    public function test_publication_date_is_set_once_on_first_publication(): void
    {
        Carbon::setTestNow('2026-01-10 10:00:00');
        $project = $this->service->create($this->data());
        $project = $this->service->update($project, ['status' => 'published']);
        $this->assertEquals('2026-01-10 10:00:00', $project->published_at->toDateTimeString());

        // Une modification ultérieure ne change pas la date de mise en ligne.
        Carbon::setTestNow('2026-03-01 10:00:00');
        $project = $this->service->update($project, ['title' => 'Autre titre', 'status' => 'published']);
        $this->assertEquals('2026-01-10 10:00:00', $project->published_at->toDateTimeString());
        $this->assertSame(ProjectStatus::Published, $project->status);
    }

    public function test_technologies_are_reused_by_slug_and_deduplicated(): void
    {
        $first = $this->service->create($this->data(['technologies' => ['Laravel', ' laravel ', 'Angular']]));
        $second = $this->service->create($this->data(['technologies' => ['LARAVEL']]));

        $this->assertSame(2, Technology::count());
        $this->assertCount(2, $first->technologies);
        $this->assertSame('Laravel', $second->technologies->first()->name);
    }

    public function test_update_without_technologies_key_keeps_them(): void
    {
        $project = $this->service->create($this->data(['technologies' => ['Laravel']]));

        $project = $this->service->update($project, ['title' => 'X']);
        $this->assertCount(1, $project->technologies);

        $project = $this->service->update($project, ['technologies' => []]);
        $this->assertCount(0, $project->technologies);
    }

    public function test_public_list_is_cached_until_an_admin_change(): void
    {
        Project::factory()->create();
        $this->assertCount(1, $this->service->listPublished());

        // Écriture directe en base (hors service) : le cache n'est pas invalidé.
        Project::factory()->create();
        $this->assertCount(1, $this->service->listPublished());

        $this->service->clearCache();
        $this->assertCount(2, $this->service->listPublished());
    }
}
