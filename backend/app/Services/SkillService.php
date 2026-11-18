<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Skill;
use App\Models\SkillCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Compétences et catégories de compétences. */
class SkillService
{
    public const CACHE_KEY = 'site.skills';

    // ---------------------------------------------------------------- Site public

    /**
     * Catégories (dans l'ordre) avec leurs seules compétences visibles.
     * Une catégorie sans compétence visible n'est pas renvoyée.
     *
     * @return Collection<int, SkillCategory>
     */
    public function listVisibleGrouped(): Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => SkillCategory::query()
            ->whereHas('skills', fn ($q) => $q->visible())
            ->with(['skills' => fn ($q) => $q->visible()])
            ->ordered()
            ->get());
    }

    // ---------------------------------------------------------------- Admin : catégories

    /** @return Collection<int, SkillCategory> */
    public function listCategories(): Collection
    {
        return SkillCategory::query()->with('skills')->ordered()->get();
    }

    /** @param  array<string, mixed>  $data */
    public function createCategory(array $data): SkillCategory
    {
        $category = SkillCategory::create($data);
        $this->clearCache();

        return $category->load('skills');
    }

    /** @param  array<string, mixed>  $data */
    public function updateCategory(SkillCategory $category, array $data): SkillCategory
    {
        $category->update($data);
        $this->clearCache();

        return $category->load('skills');
    }

    /** Supprime la catégorie ET ses compétences (on delete cascade en base). */
    public function deleteCategory(SkillCategory $category): void
    {
        $category->delete();
        $this->clearCache();
    }

    // ---------------------------------------------------------------- Admin : compétences

    /** @return Collection<int, Skill> */
    public function listSkills(?int $categoryId = null): Collection
    {
        return Skill::query()
            ->when($categoryId, fn ($q) => $q->where('skill_category_id', $categoryId))
            ->orderBy('skill_category_id')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    /** @param  array<string, mixed>  $data */
    public function createSkill(array $data): Skill
    {
        $skill = Skill::create($data);
        $this->clearCache();

        return $skill;
    }

    /** @param  array<string, mixed>  $data */
    public function updateSkill(Skill $skill, array $data): Skill
    {
        $skill->update($data);
        $this->clearCache();

        return $skill;
    }

    public function deleteSkill(Skill $skill): void
    {
        $skill->delete();
        $this->clearCache();
    }

    /** @param  list<int>  $ids  compétences dans l'ordre voulu (glisser-déposer) */
    public function reorder(array $ids): void
    {
        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $position => $id) {
                Skill::whereKey($id)->update(['sort_order' => $position]);
            }
        });

        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
