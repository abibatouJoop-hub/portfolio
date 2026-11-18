<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ExperienceType;
use App\Enums\ProjectCategory;
use App\Models\ContactMessage;
use App\Models\Experience;
use App\Models\Project;
use App\Models\SkillCategory;
use App\Models\Technology;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Données de démonstration — uniquement en local, pour voir le site rempli.
 * Ne s'exécute que si la base ne contient encore aucun projet.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        if (Project::exists()) {
            return;
        }

        $this->skills();
        $this->projects();
        $this->experiences();

        ContactMessage::factory()->count(3)->create();
        ContactMessage::factory()->read()->count(2)->create();
        ContactMessage::factory()->archived()->create();
    }

    private function skills(): void
    {
        $catalog = [
            'Backend' => ['PHP' => 85, 'Laravel' => 85, 'PostgreSQL' => 75, 'API REST' => 80],
            'Frontend' => ['Angular' => 80, 'TypeScript' => 75, 'HTML / CSS' => 85],
            'Outils' => ['Git' => 80, 'Docker' => 60, 'Linux' => 65],
        ];

        $categoryOrder = 0;
        foreach ($catalog as $categoryName => $skills) {
            $category = SkillCategory::create(['name' => $categoryName, 'sort_order' => $categoryOrder++]);

            $skillOrder = 0;
            foreach ($skills as $name => $level) {
                $category->skills()->create(['name' => $name, 'level' => $level, 'sort_order' => $skillOrder++]);
            }
        }
    }

    private function projects(): void
    {
        $projects = [
            ['Portfolio personnel', ProjectCategory::Web, ['Laravel', 'Angular', 'PostgreSQL'], true],
            ['API de gestion de bibliothèque', ProjectCategory::Api, ['Laravel', 'PostgreSQL'], true],
            ['Boutique en ligne', ProjectCategory::Web, ['Laravel', 'Angular'], false],
            ['Application mobile de quiz', ProjectCategory::Mobile, ['Flutter'], false],
        ];

        foreach ($projects as $i => [$title, $category, $technologies, $featured]) {
            $project = Project::factory()->create([
                'title' => $title,
                'slug' => Str::slug($title),
                'category' => $category,
                'is_featured' => $featured,
                'sort_order' => $i,
            ]);
            $project->technologies()->sync($this->technologyIds($technologies));
        }

        // Un brouillon : visible dans l'admin, jamais sur le site public.
        Project::factory()->draft()->create(['title' => 'Projet en cours de rédaction', 'slug' => 'projet-en-cours-de-redaction']);
    }

    private function experiences(): void
    {
        Experience::create([
            'type' => ExperienceType::Education,
            'title' => 'Master en génie logiciel',
            'organization' => 'Université (à compléter)',
            'start_date' => '2023-10-01',
            'is_current' => true,
        ])->technologies()->sync($this->technologyIds(['Laravel', 'Angular']));

        Experience::create([
            'type' => ExperienceType::Internship,
            'title' => 'Stagiaire développeuse web',
            'organization' => 'Entreprise (à compléter)',
            'start_date' => '2023-04-01',
            'end_date' => '2023-09-30',
            'description' => 'Développement de fonctionnalités back-end et front-end.',
        ])->technologies()->sync($this->technologyIds(['Laravel', 'PostgreSQL']));
    }

    /** @param list<string> $names */
    private function technologyIds(array $names): array
    {
        return collect($names)
            ->map(fn (string $name) => Technology::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name])->id)
            ->all();
    }
}
