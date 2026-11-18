<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Parent de toutes les requêtes de l'admin : seule l'administratrice connectée est autorisée.
 * (Les routes sont déjà sous auth:sanctum ; ceci est une seconde barrière.)
 */
abstract class AdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Transforme des règles de création en règles de mise à jour partielle :
     * « sometimes » devant chaque champ (un champ absent n'est pas modifié).
     *
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    protected static function partial(array $rules): array
    {
        return collect($rules)
            ->map(fn (array $fieldRules, string $field) => str_contains($field, '.*') ? $fieldRules : ['sometimes', ...$fieldRules])
            ->all();
    }
}
