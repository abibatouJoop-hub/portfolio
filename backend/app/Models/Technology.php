<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\TechnologyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Technologie partagée (« Laravel », « Angular »…) entre projets et expériences.
 */
class Technology extends Model
{
    /** @use HasFactory<TechnologyFactory> */
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class); // pivot project_technology
    }

    public function experiences(): BelongsToMany
    {
        return $this->belongsToMany(Experience::class); // pivot experience_technology
    }
}
