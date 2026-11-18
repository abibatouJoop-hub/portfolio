<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Profile;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public'); // disque temporaire : rien n'est écrit dans storage/
        $this->actingAs(User::factory()->create());
    }

    // ---------------------------------------------------------------- Couverture de projet

    public function test_upload_cover_stores_file_with_random_name_and_returns_public_url(): void
    {
        $project = Project::factory()->create();

        $response = $this->postJson("/api/v1/admin/projects/{$project->id}/cover", [
            'file' => UploadedFile::fake()->image('ma photo.jpg', 1200, 800),
        ])->assertOk();

        $path = $project->fresh()->cover_path;
        $this->assertStringStartsWith('projects/', $path);
        $this->assertStringNotContainsString('ma photo', $path); // nom aléatoire
        Storage::disk('public')->assertExists($path);
        $this->assertStringEndsWith("/storage/{$path}", $response->json('data.cover_url'));
    }

    public function test_replacing_cover_deletes_the_old_file(): void
    {
        $project = Project::factory()->create();
        $uri = "/api/v1/admin/projects/{$project->id}/cover";

        $this->postJson($uri, ['file' => UploadedFile::fake()->image('a.png')])->assertOk();
        $old = $project->fresh()->cover_path;

        $this->postJson($uri, ['file' => UploadedFile::fake()->image('b.webp')])->assertOk();
        $new = $project->fresh()->cover_path;

        $this->assertNotSame($old, $new);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);
    }

    public function test_new_cover_is_visible_on_the_public_site(): void
    {
        $project = Project::factory()->create(['cover_path' => null]);
        $this->getJson('/api/v1/projects')->assertJsonPath('data.0.cover_url', null); // met en cache

        $this->postJson("/api/v1/admin/projects/{$project->id}/cover", ['file' => UploadedFile::fake()->image('a.jpg')]);

        $this->assertNotNull($this->getJson('/api/v1/projects')->json('data.0.cover_url'));
    }

    public function test_delete_cover(): void
    {
        $project = Project::factory()->create();
        $this->postJson("/api/v1/admin/projects/{$project->id}/cover", ['file' => UploadedFile::fake()->image('a.jpg')]);
        $path = $project->fresh()->cover_path;

        $this->deleteJson("/api/v1/admin/projects/{$project->id}/cover")
            ->assertOk()
            ->assertJsonPath('data.cover_url', null);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_cover_validation_rejects_wrong_type_size_and_svg(): void
    {
        $uri = '/api/v1/admin/projects/'.Project::factory()->create()->id.'/cover';

        $this->postJson($uri, [])->assertJsonValidationErrors('file');
        $this->postJson($uri, ['file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')])->assertJsonValidationErrors('file');
        $this->postJson($uri, ['file' => UploadedFile::fake()->image('enorme.jpg')->size(3000)])->assertJsonValidationErrors('file');
        $this->postJson($uri, ['file' => UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml')])->assertJsonValidationErrors('file');

        $this->assertEmpty(Storage::disk('public')->allFiles());
    }

    // ---------------------------------------------------------------- Photo et CV du profil

    public function test_upload_and_delete_profile_photo(): void
    {
        Profile::factory()->create();

        $this->postJson('/api/v1/admin/profile/photo', ['file' => UploadedFile::fake()->image('moi.jpg')])
            ->assertOk()
            ->assertJsonPath('data.photo_url', fn (?string $url) => $url !== null && str_contains($url, '/storage/profile/photo/'));

        $path = Profile::first()->photo_path;
        Storage::disk('public')->assertExists($path);

        $this->deleteJson('/api/v1/admin/profile/photo')->assertOk()->assertJsonPath('data.photo_url', null);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_upload_cv_accepts_pdf_only_up_to_5_mb(): void
    {
        Profile::factory()->create();

        $this->postJson('/api/v1/admin/profile/cv', ['file' => UploadedFile::fake()->create('cv.pdf', 4000, 'application/pdf')])
            ->assertOk()
            ->assertJsonPath('data.cv_url', fn (?string $url) => $url !== null && str_ends_with($url, '.pdf'));

        $this->postJson('/api/v1/admin/profile/cv', ['file' => UploadedFile::fake()->create('cv.docx', 100)])
            ->assertJsonValidationErrors('file');
        $this->postJson('/api/v1/admin/profile/cv', ['file' => UploadedFile::fake()->create('cv.pdf', 6000, 'application/pdf')])
            ->assertJsonValidationErrors('file');
    }
}
