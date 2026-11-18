<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ExperienceType;
use App\Models\Experience;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Experience> */
class ExperienceFactory extends Factory
{
    /** Par défaut : une expérience terminée (date de fin après la date de début). */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-6 years', '-1 year');
        $end = fake()->dateTimeBetween($start, 'now');

        return [
            'type' => fake()->randomElement(ExperienceType::cases()),
            'title' => fake()->jobTitle(),
            'organization' => fake()->company(),
            'location' => fake()->city(),
            'start_date' => $start,
            'end_date' => $end,
            'is_current' => false,
            'description' => fake()->paragraph(),
            'sort_order' => 0,
        ];
    }

    /** Poste ou formation en cours : pas de date de fin. */
    public function current(): static
    {
        return $this->state([
            'end_date' => null,
            'is_current' => true,
        ]);
    }
}
