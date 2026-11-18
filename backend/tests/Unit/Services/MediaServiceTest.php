<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\MediaService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class MediaServiceTest extends TestCase
{
    public function test_if_saving_to_the_database_fails_the_new_file_is_removed_and_the_old_one_kept(): void
    {
        Storage::fake('public');
        $old = UploadedFile::fake()->image('old.jpg')->store('projects', 'public');

        try {
            app(MediaService::class)->replace(
                UploadedFile::fake()->image('new.jpg'),
                'projects',
                $old,
                fn () => throw new RuntimeException('La base a planté'),
            );
            $this->fail('L\'exception aurait dû remonter.');
        } catch (RuntimeException) {
        }

        // Seul l'ancien fichier reste : pas de fichier orphelin, pas de perte.
        $this->assertSame([$old], Storage::disk('public')->allFiles());
    }
}
