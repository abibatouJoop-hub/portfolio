<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SkillCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SkillCategory> */
class SkillCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->unique()->words(2, true)),
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
