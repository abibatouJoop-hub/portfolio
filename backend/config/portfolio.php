<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Configuration propre au portfolio
|--------------------------------------------------------------------------
| On lit le .env ici (et jamais directement dans le code avec env()) :
| après `php artisan config:cache`, env() renvoie null hors des fichiers de config.
*/

return [

    'admin' => [
        'name' => env('ADMIN_NAME', 'Administratrice'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    'contact' => [
        // Adresse qui reçoit les messages du formulaire (par défaut : celle de l'admin).
        'notification_email' => env('CONTACT_NOTIFICATION_EMAIL', env('ADMIN_EMAIL')),
    ],

    // Adresse du site Angular (lien « Voir dans l'admin » dans les e-mails).
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:4200'),

    // Page Angular qui reçoit le lien « Mot de passe oublié ? » (?token=…&email=…).
    'password_reset_path' => env('FRONTEND_PASSWORD_RESET_PATH', '/admin/reset-password'),

];
