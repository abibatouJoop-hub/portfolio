<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\SocialLink;
use Illuminate\Database\Seeder;

/**
 * Crée le profil unique et les liens sociaux avec des valeurs de départ,
 * à modifier ensuite depuis l'espace admin.
 *
 * Ne touche à rien si le profil existe déjà : relancer le seeder
 * n'écrase pas les modifications faites dans l'admin.
 */
class ProfileSeeder extends Seeder
{
    public function run(): void
    {
        if (Profile::exists()) {
            return;
        }

        Profile::create([
            'first_name' => 'Ma Aby',
            'last_name' => 'Diop',
            'title' => 'Développeuse web full-stack',
            'hero_title' => 'Bonjour, je suis Ma Aby Diop',
            'hero_subtitle' => 'Je conçois et développe des applications web modernes, de l\'API à l\'interface.',
            'main_stack' => 'Laravel · Angular · PostgreSQL',
            'about_title' => 'À propos de moi',
            'about_text' => 'Développeuse web full-stack passionnée par les applications bien construites : '
                .'des API robustes avec Laravel et PostgreSQL, des interfaces soignées avec Angular. '
                .'(Texte provisoire, à personnaliser depuis l\'espace admin.)',
            'location' => null,
            'education' => null,
            'languages' => ['Français', 'Anglais'],
            'contact_email' => config('portfolio.admin.email'),
            'phone' => null,
            'is_available' => true,
        ]);

        $links = [
            ['platform' => 'github', 'url' => 'https://github.com/Abibatou-Jop', 'sort_order' => 1],
            ['platform' => 'linkedin', 'url' => 'https://www.linkedin.com/', 'sort_order' => 2],
        ];

        foreach ($links as $link) {
            SocialLink::firstOrCreate(['platform' => $link['platform']], $link);
        }
    }
}
