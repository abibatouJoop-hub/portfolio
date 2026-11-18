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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug', 170)->unique();  // URL publique /projets/{slug}
            $table->string('summary', 300);
            $table->text('description')->nullable();
            $table->string('category', 20);         // App\Enums\ProjectCategory
            $table->string('status', 20)->index();  // App\Enums\ProjectStatus
            $table->boolean('is_featured')->default(false);
            $table->string('cover_path', 255)->nullable();
            $table->string('demo_url', 255)->nullable();
            $table->string('repo_url', 255)->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Index partiel : le site public ne lit que les projets publiés et non supprimés,
        // triés par sort_order. L'index ne contient que ces lignes-là.
        DB::statement("CREATE INDEX projects_public_idx ON projects (sort_order) WHERE status = 'published' AND deleted_at IS NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
