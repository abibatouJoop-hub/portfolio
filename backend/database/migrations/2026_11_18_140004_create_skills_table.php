<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skill_category_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->smallInteger('level');
            $table->smallInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            // Un même nom ne peut apparaître qu'une fois par catégorie.
            $table->unique(['skill_category_id', 'name']);
        });

        DB::statement('ALTER TABLE skills ADD CONSTRAINT skills_level_range CHECK (level BETWEEN 0 AND 100)');
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
