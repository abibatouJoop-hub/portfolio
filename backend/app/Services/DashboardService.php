<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Models\ContactMessage;
use App\Models\Experience;
use App\Models\Project;
use App\Models\Skill;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as BaseCollection;

/** Données de la page d'accueil de l'admin. */
class DashboardService
{
    /** @return array<string, int> */
    public function counters(): array
    {
        return [
            'projects_published' => Project::query()->where('status', ProjectStatus::Published)->count(),
            'projects_draft' => Project::query()->where('status', ProjectStatus::Draft)->count(),
            'skills' => Skill::query()->count(),
            'experiences' => Experience::query()->count(),
            'messages_unread' => ContactMessage::query()->unread()->count(),
            'messages_inbox' => ContactMessage::query()->inbox()->count(),
        ];
    }

    /** @return Collection<int, ContactMessage> */
    public function latestMessages(int $limit = 5): Collection
    {
        return ContactMessage::query()->inbox()->latest()->latest('id')->limit($limit)->get();
    }

    /**
     * Derniers contenus modifiés, tous types confondus.
     *
     * @return BaseCollection<int, array{type: string, id: int, label: string, updated_at: string|null}>
     */
    public function recentChanges(int $limit = 5): BaseCollection
    {
        $sources = [
            'project' => [Project::class, 'title'],
            'experience' => [Experience::class, 'title'],
            'skill' => [Skill::class, 'name'],
        ];

        return collect($sources)
            ->flatMap(fn (array $source, string $type) => $source[0]::query()
                ->latest('updated_at')
                ->limit($limit)
                ->get(['id', $source[1], 'updated_at'])
                ->map(fn ($model) => [
                    'type' => $type,
                    'id' => $model->id,
                    'label' => $model->{$source[1]},
                    'updated_at' => $model->updated_at?->toIso8601String(),
                ]))
            ->sortByDesc('updated_at')
            ->take($limit)
            ->values();
    }
}
