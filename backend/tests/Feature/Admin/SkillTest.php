<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SkillTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    // ---------------------------------------------------------------- Catégories

    public function test_category_crud(): void
    {
        $id = $this->postJson('/api/v1/admin/skill-categories', ['name' => 'Backend'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Backend')
            ->json('data.id');

        $this->putJson("/api/v1/admin/skill-categories/{$id}", ['name' => 'Back-end'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Back-end');

        $this->getJson('/api/v1/admin/skill-categories')->assertJsonCount(1, 'data');

        $this->deleteJson("/api/v1/admin/skill-categories/{$id}")->assertNoContent();
        $this->assertDatabaseCount('skill_categories', 0);
    }

    public function test_category_name_must_be_unique_but_can_be_kept_on_update(): void
    {
        $category = SkillCategory::factory()->create(['name' => 'Backend']);

        $this->postJson('/api/v1/admin/skill-categories', ['name' => 'Backend'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');

        $this->putJson("/api/v1/admin/skill-categories/{$category->id}", ['name' => 'Backend'])
            ->assertOk();
    }

    public function test_deleting_a_category_deletes_its_skills(): void
    {
        $category = SkillCategory::factory()->create();
        Skill::factory()->for($category, 'category')->count(2)->create();

        $this->deleteJson("/api/v1/admin/skill-categories/{$category->id}")->assertNoContent();

        $this->assertDatabaseCount('skills', 0);
    }

    // ---------------------------------------------------------------- Compétences

    public function test_store_skill_and_it_appears_on_the_public_site(): void
    {
        $category = SkillCategory::factory()->create();
        $this->getJson('/api/v1/skills')->assertJsonCount(0, 'data'); // met en cache

        $this->postJson('/api/v1/admin/skills', ['skill_category_id' => $category->id, 'name' => 'PHP', 'level' => 85])
            ->assertCreated()
            ->assertJsonPath('data.is_visible', true);

        $this->getJson('/api/v1/skills')->assertJsonPath('data.0.skills.0.name', 'PHP');
    }

    public function test_skill_validation(): void
    {
        $category = SkillCategory::factory()->create();
        Skill::factory()->for($category, 'category')->create(['name' => 'PHP']);

        $this->postJson('/api/v1/admin/skills', ['skill_category_id' => 999, 'name' => '', 'level' => 150])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['skill_category_id', 'name', 'level']);

        // Même nom dans la même catégorie : refusé…
        $this->postJson('/api/v1/admin/skills', ['skill_category_id' => $category->id, 'name' => 'PHP', 'level' => 50])
            ->assertJsonValidationErrors('name');

        // … mais accepté dans une autre catégorie.
        $other = SkillCategory::factory()->create();
        $this->postJson('/api/v1/admin/skills', ['skill_category_id' => $other->id, 'name' => 'PHP', 'level' => 50])
            ->assertCreated();
    }

    public function test_update_skill_partially_and_hide_it(): void
    {
        $skill = Skill::factory()->create(['level' => 50]);

        $this->putJson("/api/v1/admin/skills/{$skill->id}", ['level' => 90, 'is_visible' => false])
            ->assertOk()
            ->assertJsonPath('data.level', 90)
            ->assertJsonPath('data.is_visible', false)
            ->assertJsonPath('data.name', $skill->name);
    }

    public function test_index_filters_by_category(): void
    {
        $category = SkillCategory::factory()->create();
        Skill::factory()->for($category, 'category')->create();
        Skill::factory()->create();

        $this->getJson("/api/v1/admin/skills?category={$category->id}")->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/skills')->assertJsonCount(2, 'data');
    }

    public function test_reorder_skills(): void
    {
        $category = SkillCategory::factory()->create();
        [$a, $b] = Skill::factory()->for($category, 'category')->count(2)->create();

        $this->patchJson('/api/v1/admin/skills/reorder', ['ids' => [$b->id, $a->id]])->assertNoContent();

        $this->getJson('/api/v1/skills')->assertJsonPath('data.0.skills.*.id', [$b->id, $a->id]);
    }

    public function test_destroy_skill(): void
    {
        $skill = Skill::factory()->create();

        $this->deleteJson("/api/v1/admin/skills/{$skill->id}")->assertNoContent();
        $this->assertModelMissing($skill);
    }
}
