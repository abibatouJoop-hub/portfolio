<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Vérifie que PostgreSQL protège lui-même les données,
 * indépendamment de la validation Laravel.
 */
class DatabaseConstraintsTest extends TestCase
{
    use RefreshDatabase;

    private function category(): int
    {
        return DB::table('skill_categories')->insertGetId(['name' => 'Backend']);
    }

    public function test_skill_level_must_be_between_0_and_100(): void
    {
        $this->expectException(QueryException::class);

        DB::table('skills')->insert(['skill_category_id' => $this->category(), 'name' => 'PHP', 'level' => 150]);
    }

    public function test_skill_name_is_unique_within_a_category(): void
    {
        $categoryId = $this->category();
        DB::table('skills')->insert(['skill_category_id' => $categoryId, 'name' => 'PHP', 'level' => 80]);

        $this->expectException(QueryException::class);
        DB::table('skills')->insert(['skill_category_id' => $categoryId, 'name' => 'PHP', 'level' => 60]);
    }

    public function test_deleting_a_category_deletes_its_skills(): void
    {
        $categoryId = $this->category();
        DB::table('skills')->insert(['skill_category_id' => $categoryId, 'name' => 'PHP', 'level' => 80]);

        DB::table('skill_categories')->where('id', $categoryId)->delete();

        $this->assertDatabaseCount('skills', 0);
    }

    public function test_experience_end_date_cannot_precede_start_date(): void
    {
        $this->expectException(QueryException::class);

        DB::table('experiences')->insert([
            'type' => 'work', 'title' => 'Développeuse', 'organization' => 'ACME',
            'start_date' => '2025-06-01', 'end_date' => '2024-01-01',
        ]);
    }

    public function test_profile_languages_must_be_a_json_array(): void
    {
        $this->expectException(QueryException::class);

        DB::table('profiles')->insert([
            'first_name' => 'Ma', 'last_name' => 'Aby', 'title' => 'Dev',
            'languages' => json_encode(['fr' => 'Français']),
        ]);
    }

    public function test_contact_message_rejects_invalid_ip_address(): void
    {
        $this->expectException(QueryException::class);

        DB::table('contact_messages')->insert([
            'name' => 'Test', 'email' => 'a@b.c', 'subject' => 'Salut', 'body' => '…',
            'ip_address' => 'pas-une-ip',
        ]);
    }
}
