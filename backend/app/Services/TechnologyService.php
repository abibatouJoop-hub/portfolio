<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Experience;
use App\Models\Project;
use App\Models\Technology;
use Illuminate\Support\Str;

/**
 * Gère la table partagée des technologies, pour les projets comme pour les expériences.
 */
class TechnologyService
{
    /**
     * Associe au modèle exactement les technologies données par leur nom :
     * crée celles qui manquent (reconnues par leur slug), retire les autres.
     *
     * ['Laravel', 'laravel ', 'Angular'] → 2 technologies (« Laravel » et « laravel » ont le même slug).
     *
     * @param  list<string>  $names
     */
    public function sync(Project|Experience $model, array $names): void
    {
        $ids = collect($names)
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->unique(fn (string $name) => Str::slug($name))
            ->map(fn (string $name) => Technology::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            )->id)
            ->values()
            ->all();

        $model->technologies()->sync($ids);
    }
}
