<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Profil unique du portfolio (une seule ligne) : accueil, « À propos », pied de page.
 */
class Profile extends Model
{
    /** @use HasFactory<ProfileFactory> */
    use HasFactory;

    protected $fillable = [
        'first_name', 'last_name', 'title',
        'hero_title', 'hero_subtitle', 'main_stack',
        'about_title', 'about_text',
        'location', 'education', 'languages',
        'contact_email', 'phone', 'is_available',
        'photo_path', 'cv_path',
    ];

    protected $attributes = [
        'languages' => '[]',
        'is_available' => true,
    ];

    protected function casts(): array
    {
        return [
            'languages' => 'array',
            'is_available' => 'boolean',
        ];
    }
}
