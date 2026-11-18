<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExperienceType;
use App\Models\Experience;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Parcours : emplois, stages, formations. */
class ExperienceService
{
    public const CACHE_KEY = 'site.experiences';

    public function __construct(private readonly TechnologyService $technologies) {}

    /** @return Collection<int, Experience> */
    public function listPublic(): Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => Experience::query()
            ->with('technologies')
            ->latestFirst()
            ->get());
    }

    /** @return Collection<int, Experience> */
    public function listForAdmin(?ExperienceType $type = null): Collection
    {
        return Experience::query()
            ->with('technologies')
            ->when($type, fn ($q) => $q->where('type', $type))
            ->latestFirst()
            ->get();
    }

    /** @param  array<string, mixed>  $data */
    public function create(array $data): Experience
    {
        $experience = DB::transaction(function () use ($data) {
            $experience = new Experience(Arr::except($data, 'technologies'));
            $this->applyCurrentRule($experience);
            $experience->save();

            $this->technologies->sync($experience, $data['technologies'] ?? []);

            return $experience;
        });

        $this->clearCache();

        return $experience->load('technologies');
    }

    /** @param  array<string, mixed>  $data */
    public function update(Experience $experience, array $data): Experience
    {
        DB::transaction(function () use ($experience, $data) {
            $experience->fill(Arr::except($data, 'technologies'));
            $this->applyCurrentRule($experience);
            $experience->save();

            if (array_key_exists('technologies', $data)) {
                $this->technologies->sync($experience, $data['technologies'] ?? []);
            }
        });

        $this->clearCache();

        return $experience->load('technologies');
    }

    public function delete(Experience $experience): void
    {
        $experience->delete();
        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** Règle métier : un poste « en cours » n'a pas de date de fin. */
    private function applyCurrentRule(Experience $experience): void
    {
        if ($experience->is_current) {
            $experience->end_date = null;
        }
    }
}
