<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProfileSeeder::class,
        ]);

        // Données fictives : jamais en production.
        if (app()->environment('local')) {
            $this->call(DemoContentSeeder::class);
        }
    }
}
