<?php

declare(strict_types=1);

namespace App\Services;

use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Seul point d'entrée pour les fichiers envoyés (couvertures, photo, CV).
 * Disque « public » : storage/app/public, servi via le lien public/storage.
 */
class MediaService
{
    private const DISK = 'public';

    /**
     * Enregistre le nouveau fichier, le fait persister par $persist, puis supprime l'ancien.
     *
     * L'ordre compte :
     *  1. on écrit d'abord le nouveau fichier (nom aléatoire, jamais celui de l'utilisateur) ;
     *  2. on met à jour la base via $persist ; si ça échoue, on efface le nouveau fichier
     *     et l'ancien reste intact ;
     *  3. seulement ensuite on supprime l'ancien fichier.
     *
     * @param  Closure(string): void  $persist  reçoit le nouveau chemin
     * @return string chemin relatif au disque, ex. « projects/Xb3k…9.webp »
     */
    public function replace(UploadedFile $file, string $directory, ?string $oldPath, Closure $persist): string
    {
        $newPath = $file->store($directory, self::DISK);

        try {
            $persist($newPath);
        } catch (Throwable $e) {
            $this->delete($newPath);
            throw $e;
        }

        $this->delete($oldPath);

        return $newPath;
    }

    public function delete(?string $path): void
    {
        if ($path !== null && $path !== '') {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    public function url(?string $path): ?string
    {
        return $path ? Storage::disk(self::DISK)->url($path) : null;
    }
}
