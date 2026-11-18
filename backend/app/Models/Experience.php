<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExperienceType;
use Database\Factories\ExperienceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Élément du parcours : emploi, stage ou formation.
 */
class Experience extends Model
{
    /** @use HasFactory<ExperienceFactory> */
    use HasFactory;

    protected $fillable = [
        'type', 'title', 'organization', 'location',
        'start_date', 'end_date', 'is_current', 'description', 'sort_order',
    ];

    protected $attributes = [
        'is_current' => false,
        'sort_order' => 0,
    ];

    protected function casts(): array
    {
        return [
            'type' => ExperienceType::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class)->orderBy('name'); // pivot experience_technology
    }

    /** Du plus récent au plus ancien : postes en cours d'abord, puis par date de début. */
    public function scopeLatestFirst(Builder $query): void
    {
        $query->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->orderBy('sort_order');
    }
}
