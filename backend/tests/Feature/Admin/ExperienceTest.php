<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Experience;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExperienceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    /** @param  array<string, mixed>  $overrides */
    private function payload(array $overrides = []): array
    {
        return [
            'type' => 'work',
            'title' => 'Développeuse full-stack',
            'organization' => 'ACME',
            'start_date' => '2024-01-01',
            'end_date' => '2024-12-31',
            ...$overrides,
        ];
    }

    public function test_store_with_technologies(): void
    {
        $this->postJson('/api/v1/admin/experiences', $this->payload(['technologies' => ['Laravel', 'Angular']]))
            ->assertCreated()
            ->assertJsonPath('data.type', 'work')
            ->assertJsonPath('data.technologies', ['Angular', 'Laravel']);
    }

    public function test_store_validation(): void
    {
        $this->postJson('/api/v1/admin/experiences', $this->payload([
            'type' => 'freelance',
            'start_date' => '2024-06-01',
            'end_date' => '2024-01-01',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['type', 'end_date']);
    }

    public function test_current_position_has_no_end_date(): void
    {
        $this->postJson('/api/v1/admin/experiences', $this->payload(['is_current' => true]))
            ->assertCreated()
            ->assertJsonPath('data.is_current', true)
            ->assertJsonPath('data.end_date', null);
    }

    public function test_update_compares_dates_with_stored_values(): void
    {
        $experience = Experience::factory()->create(['start_date' => '2024-01-01', 'end_date' => '2024-06-30']);

        // Seule la date de début est envoyée, et elle dépasse la date de fin enregistrée.
        $this->putJson("/api/v1/admin/experiences/{$experience->id}", ['start_date' => '2025-01-01'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('end_date');

        $this->putJson("/api/v1/admin/experiences/{$experience->id}", ['title' => 'Nouveau poste'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Nouveau poste')
            ->assertJsonPath('data.start_date', '2024-01-01');
    }

    public function test_index_filters_by_type_and_destroy(): void
    {
        Experience::factory()->create(['type' => 'work']);
        $school = Experience::factory()->create(['type' => 'education']);

        $this->getJson('/api/v1/admin/experiences?type=education')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $school->id);

        $this->deleteJson("/api/v1/admin/experiences/{$school->id}")->assertNoContent();
        $this->assertModelMissing($school);
    }
}
