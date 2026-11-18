<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Profile;
use App\Models\SocialLink;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Profil unique et liens vers les réseaux sociaux. */
class ProfileService
{
    public const CACHE_KEY = 'site.profile';

    /** Type de fichier → colonne de la table profiles. */
    private const FILE_COLUMNS = ['photo' => 'photo_path', 'cv' => 'cv_path'];

    public function __construct(private readonly MediaService $media) {}

    /** Profil + réseaux pour le site public (en cache). */
    public function getPublic(): Profile
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => $this->get());
    }

    /** Profil + réseaux, lus en base. 404 si le profil n'a pas encore été créé (seeder). */
    public function get(): Profile
    {
        return Profile::query()->firstOrFail()
            ->setRelation('socialLinks', SocialLink::query()->ordered()->get());
    }

    /** @param  array<string, mixed>  $data  données validées par UpdateProfileRequest */
    public function update(array $data): Profile
    {
        DB::transaction(function () use ($data) {
            Profile::query()->firstOrFail()->update(Arr::except($data, 'social_links'));

            if (array_key_exists('social_links', $data)) {
                $this->replaceSocialLinks($data['social_links'] ?? []);
            }
        });

        $this->clearCache();

        return $this->get();
    }

    /**
     * Remplace la photo ou le CV.
     *
     * @param  'photo'|'cv'  $kind
     */
    public function replaceFile(string $kind, UploadedFile $file): Profile
    {
        $profile = Profile::query()->firstOrFail();
        $column = self::FILE_COLUMNS[$kind];

        $this->media->replace($file, "profile/{$kind}", $profile->{$column}, function (string $path) use ($profile, $column) {
            $profile->update([$column => $path]);
        });
        $this->clearCache();

        return $this->get();
    }

    /** @param  'photo'|'cv'  $kind */
    public function removeFile(string $kind): Profile
    {
        $profile = Profile::query()->firstOrFail();
        $column = self::FILE_COLUMNS[$kind];

        $this->media->delete($profile->{$column});
        $profile->update([$column => null]);
        $this->clearCache();

        return $this->get();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * La liste reçue devient LA liste des réseaux : mise à jour par plateforme,
     * ordre = ordre reçu, suppression des plateformes absentes.
     *
     * @param  list<array{platform: string, url: string}>  $links
     */
    private function replaceSocialLinks(array $links): void
    {
        $platforms = [];

        foreach (array_values($links) as $position => $link) {
            $platform = strtolower($link['platform']);
            SocialLink::updateOrCreate(['platform' => $platform], ['url' => $link['url'], 'sort_order' => $position]);
            $platforms[] = $platform;
        }

        SocialLink::query()->whereNotIn('platform', $platforms)->delete();
    }
}
