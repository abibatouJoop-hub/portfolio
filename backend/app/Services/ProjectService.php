<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Toute la logique métier des projets : slug unique, date de publication,
 * technologies, ordre d'affichage et cache du site public.
 */
class ProjectService
{
    /** Clé du cache contenant tous les projets publiés (site public). */
    public const CACHE_KEY = 'site.projects';

    public function __construct(
        private readonly TechnologyService $technologies,
        private readonly MediaService $media,
    ) {}

    // ---------------------------------------------------------------- Site public

    /**
     * Projets publiés, dans l'ordre d'affichage, éventuellement filtrés par catégorie.
     * La liste complète est mise en cache ; le filtre s'applique en mémoire.
     *
     * @return Collection<int, Project>
     */
    public function listPublished(?ProjectCategory $category = null): Collection
    {
        $projects = $this->publishedFromCache();

        return $category === null
            ? $projects
            : $projects->filter(fn (Project $p) => $p->category === $category)->values();
    }

    public function findPublishedBySlug(string $slug): Project
    {
        return $this->publishedFromCache()->firstWhere('slug', $slug)
            ?? throw (new ModelNotFoundException)->setModel(Project::class, [$slug]);
    }

    // ---------------------------------------------------------------- Admin

    /** @return Collection<int, Project> */
    public function listForAdmin(?ProjectStatus $status = null): Collection
    {
        return Project::query()
            ->with('technologies')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->ordered()
            ->get();
    }

    /** @param  array<string, mixed>  $data  données validées par StoreProjectRequest */
    public function create(array $data): Project
    {
        $project = DB::transaction(function () use ($data) {
            $project = Project::create([
                ...Arr::except($data, 'technologies'),
                'slug' => $this->uniqueSlug($data['title']),
                'published_at' => $data['status'] === ProjectStatus::Published->value ? now() : null,
            ]);

            $this->technologies->sync($project, $data['technologies'] ?? []);

            return $project;
        });

        $this->clearCache();

        return $project->load('technologies');
    }

    /** @param  array<string, mixed>  $data  données validées par UpdateProjectRequest (partielles) */
    public function update(Project $project, array $data): Project
    {
        DB::transaction(function () use ($project, $data) {
            $wasPublished = $project->status === ProjectStatus::Published;
            $project->fill(Arr::except($data, 'technologies'));

            // Première publication : on date la mise en ligne.
            // Le slug, lui, ne change pas quand on renomme le projet : l'URL publique reste stable.
            if (! $wasPublished && $project->status === ProjectStatus::Published) {
                $project->published_at = now();
            }
            $project->save();

            if (array_key_exists('technologies', $data)) {
                $this->technologies->sync($project, $data['technologies'] ?? []);
            }
        });

        $this->clearCache();

        return $project->load('technologies');
    }

    public function delete(Project $project): void
    {
        $project->delete(); // soft delete : la ligne et l'image restent récupérables
        $this->clearCache();
    }

    /** Remplace l'image de couverture (l'ancienne est supprimée du disque). */
    public function updateCover(Project $project, UploadedFile $file): Project
    {
        $this->media->replace($file, 'projects', $project->cover_path, function (string $path) use ($project) {
            $project->update(['cover_path' => $path]);
        });
        $this->clearCache();

        return $project->load('technologies');
    }

    public function removeCover(Project $project): Project
    {
        $this->media->delete($project->cover_path);
        $project->update(['cover_path' => null]);
        $this->clearCache();

        return $project->load('technologies');
    }

    /**
     * Enregistre un nouvel ordre d'affichage (glisser-déposer dans l'admin).
     *
     * @param  list<int>  $ids  identifiants dans l'ordre voulu
     */
    public function reorder(array $ids): void
    {
        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $position => $id) {
                Project::whereKey($id)->update(['sort_order' => $position]);
            }
        });

        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    // ---------------------------------------------------------------- Interne

    /** @return Collection<int, Project> */
    private function publishedFromCache(): Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => Project::published()
            ->with('technologies')
            ->ordered()
            ->get());
    }

    /** « Mon projet » → mon-projet, puis mon-projet-2, mon-projet-3… (projets supprimés compris). */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'projet';
        $slug = $base;
        $i = 2;

        while (Project::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
