<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Experience;
use Illuminate\Validation\Validator;

class UpdateExperienceRequest extends StoreExperienceRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $rules = self::partial(parent::rules());

        // « after_or_equal:start_date » ne marche que si start_date est envoyée :
        // la comparaison avec la date déjà enregistrée est faite dans after().
        $rules['end_date'] = ['sometimes', 'nullable', 'date'];

        return $rules;
    }

    /**
     * Compare les dates finales (envoyées ou déjà en base), sinon la contrainte
     * CHECK de PostgreSQL rejetterait la ligne avec une erreur 500.
     *
     * @return list<callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->hasAny(['start_date', 'end_date'])) {
                return;
            }

            /** @var Experience $experience */
            $experience = $this->route('experience');
            $start = $this->has('start_date') ? $this->date('start_date') : $experience->start_date;
            $end = $this->has('end_date') ? $this->date('end_date') : $experience->end_date;

            if ($start !== null && $end !== null && $end->lt($start)) {
                $validator->errors()->add('end_date', 'La date de fin doit être postérieure ou égale à la date de début.');
            }
        }];
    }
}
