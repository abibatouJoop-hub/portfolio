<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Profile> */
class ProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'title' => 'Développeuse web full-stack',
            'hero_title' => fake()->sentence(4),
            'hero_subtitle' => fake()->paragraph(),
            'main_stack' => 'Laravel · Angular · PostgreSQL',
            'about_title' => 'À propos',
            'about_text' => fake()->paragraphs(2, true),
            'location' => fake()->city(),
            'education' => 'Master en génie logiciel',
            'languages' => ['Français', 'Anglais'],
            'contact_email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'is_available' => true,
        ];
    }
}
