<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Crée l'unique compte admin à partir de ADMIN_EMAIL / ADMIN_PASSWORD (.env).
 * Aucun identifiant n'est écrit dans le code.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('portfolio.admin.email');
        $password = config('portfolio.admin.password');

        if (blank($email) || blank($password)) {
            throw new RuntimeException('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans le fichier .env.');
        }

        $user = User::firstOrNew(['email' => $email]);

        // On ne réécrit pas le mot de passe d'un compte existant : s'il a été
        // changé depuis l'admin, relancer les seeders ne doit pas l'écraser.
        if (! $user->exists) {
            $user->password = $password; // haché automatiquement (cast "hashed")
        }

        $user->name = config('portfolio.admin.name');
        $user->save();
    }
}
