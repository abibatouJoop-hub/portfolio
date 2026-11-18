<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Profil unique : accueil, « À propos », pied de page. */
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('title', 150);
            $table->string('hero_title', 200)->nullable();
            $table->text('hero_subtitle')->nullable();
            $table->string('main_stack', 150)->nullable();
            $table->string('about_title', 200)->nullable();
            $table->text('about_text')->nullable();
            $table->string('location', 150)->nullable();
            $table->string('education', 150)->nullable();
            $table->jsonb('languages')->default(DB::raw("'[]'::jsonb"));
            $table->string('contact_email', 255)->nullable();
            $table->string('phone', 30)->nullable();
            $table->boolean('is_available')->default(true);
            $table->string('photo_path', 255)->nullable();
            $table->string('cv_path', 255)->nullable();
            $table->timestamps();
        });

        // languages doit toujours être un tableau JSON : ["Français", "Anglais"].
        DB::statement("ALTER TABLE profiles ADD CONSTRAINT profiles_languages_is_array CHECK (jsonb_typeof(languages) = 'array')");
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
