<?php

declare(strict_types=1);

namespace Tests\Unit\Models;

use App\Enums\ExperienceType;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\ContactMessage;
use App\Models\Experience;
use App\Models\Profile;
use App\Models\Project;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Technology;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_casts_enums_and_dates(): void
    {
        $project = Project::factory()->create(['category' => 'api', 'status' => 'draft'])->fresh();

        $this->assertSame(ProjectCategory::Api, $project->category);
        $this->assertSame(ProjectStatus::Draft, $project->status);
        $this->assertIsBool($project->is_featured);
    }

    public function test_published_scope_excludes_drafts_and_soft_deleted_projects(): void
    {
        $visible = Project::factory()->create();
        Project::factory()->draft()->create();
        Project::factory()->create()->delete();

        $this->assertEquals([$visible->id], Project::published()->pluck('id')->all());
    }

    public function test_project_and_experience_share_technologies(): void
    {
        $laravel = Technology::factory()->create(['name' => 'Laravel', 'slug' => 'laravel']);
        $project = Project::factory()->create();
        $experience = Experience::factory()->create();

        $project->technologies()->attach($laravel);
        $experience->technologies()->attach($laravel);

        $this->assertTrue($project->technologies->contains($laravel));
        $this->assertCount(1, $laravel->projects);
        $this->assertCount(1, $laravel->experiences);
    }

    public function test_skill_visible_scope_and_category_relation(): void
    {
        $category = SkillCategory::factory()->create();
        Skill::factory()->for($category, 'category')->create(['sort_order' => 2]);
        Skill::factory()->for($category, 'category')->create(['sort_order' => 1]);
        Skill::factory()->for($category, 'category')->hidden()->create(['sort_order' => 3]);

        $this->assertSame(2, Skill::visible()->count());
        // La relation renvoie les compétences dans l'ordre d'affichage.
        $this->assertSame([1, 2, 3], $category->skills->pluck('sort_order')->all());
    }

    public function test_experience_latest_first_puts_current_position_on_top(): void
    {
        $old = Experience::factory()->create(['start_date' => '2019-01-01', 'end_date' => '2020-01-01']);
        $current = Experience::factory()->current()->create(['start_date' => '2018-01-01']);
        $recent = Experience::factory()->create(['start_date' => '2023-01-01', 'end_date' => '2024-01-01']);

        $this->assertEquals([$current->id, $recent->id, $old->id], Experience::latestFirst()->pluck('id')->all());
        $this->assertSame(ExperienceType::class, $current->fresh()->type::class);
        $this->assertInstanceOf(Carbon::class, $current->fresh()->start_date);
    }

    public function test_profile_languages_is_cast_to_array(): void
    {
        $profile = Profile::factory()->create(['languages' => ['Français', 'Wolof']])->fresh();

        $this->assertSame(['Français', 'Wolof'], $profile->languages);
    }

    public function test_contact_message_scopes(): void
    {
        ContactMessage::factory()->create();
        ContactMessage::factory()->read()->create();
        ContactMessage::factory()->archived()->create();

        $this->assertSame(1, ContactMessage::unread()->count());
        $this->assertSame(2, ContactMessage::inbox()->count());
        $this->assertSame(1, ContactMessage::archived()->count());
    }
}
