<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SocialLink;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SocialLink> */
class SocialLinkFactory extends Factory
{
    public function definition(): array
    {
        $platform = fake()->unique()->randomElement(['github', 'linkedin', 'gitlab', 'x', 'dribbble', 'youtube']);

        return [
            'platform' => $platform,
            'url' => "https://{$platform}.com/".fake()->userName(),
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
