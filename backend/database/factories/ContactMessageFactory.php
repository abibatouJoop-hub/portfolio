<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ContactMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContactMessage> */
class ContactMessageFactory extends Factory
{
    /** Par défaut : un message non lu, non archivé. */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'subject' => fake()->sentence(5),
            'body' => fake()->paragraphs(2, true),
            'ip_address' => fake()->ipv4(),
            'read_at' => null,
            'archived_at' => null,
        ];
    }

    public function read(): static
    {
        return $this->state(['read_at' => now()]);
    }

    public function archived(): static
    {
        return $this->state(['read_at' => now(), 'archived_at' => now()]);
    }
}
