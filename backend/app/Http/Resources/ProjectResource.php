<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Format JSON d'un projet, indépendant des colonnes de la table.
 *
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() !== null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'category' => $this->category->value,
            'is_featured' => $this->is_featured,
            'cover_url' => $this->cover_path ? Storage::disk('public')->url($this->cover_path) : null,
            'demo_url' => $this->demo_url,
            'repo_url' => $this->repo_url,
            'technologies' => $this->whenLoaded('technologies', fn () => $this->technologies->pluck('name')),
            'published_at' => $this->published_at?->toIso8601String(),

            // Champs utiles seulement à l'admin
            'status' => $this->when($isAdmin, fn () => $this->status->value),
            'sort_order' => $this->when($isAdmin, fn () => $this->sort_order),
            'updated_at' => $this->when($isAdmin, fn () => $this->updated_at?->toIso8601String()),
        ];
    }
}
