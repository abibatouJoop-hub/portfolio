<?php

declare(strict_types=1);

namespace Tests\Feature\Site;

use App\Models\Experience;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExperienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_experiences_most_recent_first_with_dates_as_strings(): void
    {
        $old = Experience::factory()->create(['start_date' => '2019-01-01', 'end_date' => '2020-06-30']);
        $current = Experience::factory()->current()->create(['start_date' => '2022-09-01']);

        $this->getJson('/api/v1/experiences')
            ->assertOk()
            ->assertJsonPath('data.*.id', [$current->id, $old->id])
            ->assertJsonPath('data.0.is_current', true)
            ->assertJsonPath('data.0.end_date', null)
            ->assertJsonPath('data.1.start_date', '2019-01-01')
            ->assertJsonPath('data.1.end_date', '2020-06-30');
    }
}
