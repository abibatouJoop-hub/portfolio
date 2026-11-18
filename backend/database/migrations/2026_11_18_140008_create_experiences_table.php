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
        Schema::create('experiences', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);            // App\Enums\ExperienceType
            $table->string('title', 150);          // poste ou diplôme
            $table->string('organization', 150);   // entreprise ou école
            $table->string('location', 120)->nullable();
            $table->date('start_date')->index();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->text('description')->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::statement('ALTER TABLE experiences ADD CONSTRAINT experiences_dates_order CHECK (end_date IS NULL OR end_date >= start_date)');
    }

    public function down(): void
    {
        Schema::dropIfExists('experiences');
    }
};
