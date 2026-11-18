<?php

declare(strict_types=1);

namespace Tests\Feature\Site;

use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_visible_skills_grouped_by_category_in_order(): void
    {
        $frontend = SkillCategory::factory()->create(['name' => 'Frontend', 'sort_order' => 2]);
        $backend = SkillCategory::factory()->create(['name' => 'Backend', 'sort_order' => 1]);
        Skill::factory()->for($backend, 'category')->create(['name' => 'Laravel', 'sort_order' => 2]);
        Skill::factory()->for($backend, 'category')->create(['name' => 'PHP', 'sort_order' => 1]);
        Skill::factory()->for($backend, 'category')->hidden()->create(['name' => 'Caché']);
        Skill::factory()->for($frontend, 'category')->create(['name' => 'Angular']);

        $this->getJson('/api/v1/skills')
            ->assertOk()
            ->assertJsonPath('data.*.name', ['Backend', 'Frontend'])
            ->assertJsonPath('data.0.skills.*.name', ['PHP', 'Laravel'])
            ->assertJsonMissingPath('data.0.skills.0.is_visible');
    }

    public function test_category_without_visible_skill_is_not_returned(): void
    {
        $empty = SkillCategory::factory()->create();
        Skill::factory()->for($empty, 'category')->hidden()->create();

        $this->getJson('/api/v1/skills')->assertOk()->assertJsonCount(0, 'data');
    }
}
