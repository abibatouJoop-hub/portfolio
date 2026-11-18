<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Project> */
class ProjectFactory extends Factory
{
    /** Par défaut : un projet publié. */
    public function definition(): array
    {
        $title = rtrim(fake()->unique()->sentence(3), '.');

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'summary' => fake()->sentence(15),
            'description' => fake()->paragraphs(3, true),
            'category' => fake()->randomElement(ProjectCategory::cases()),
            'status' => ProjectStatus::Published,
            'is_featured' => false,
            'demo_url' => fake()->optional()->url(),
            'repo_url' => fake()->optional()->url(),
            'sort_order' => fake()->numberBetween(0, 10),
            'published_at' => fake()->dateTimeBetween('-2 years'),
        ];
    }

    public function draft(): static
    {
        return $this->state([
            'status' => ProjectStatus::Draft,
            'published_at' => null,
        ]);
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }
}
