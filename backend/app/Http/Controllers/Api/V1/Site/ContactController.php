<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Site;

use App\Http\Controllers\Controller;
use App\Http\Requests\Site\StoreContactMessageRequest;
use App\Services\ContactMessageService;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function __construct(private readonly ContactMessageService $messages) {}

    /** POST /api/v1/contact  { name, email, subject, body } — 5 par heure et par IP */
    public function store(StoreContactMessageRequest $request): JsonResponse
    {
        $this->messages->submit($request->validated(), $request->ip());

        // On ne renvoie pas le message enregistré : le visiteur n'a besoin que d'une confirmation.
        return response()->json(['message' => 'Merci, votre message a bien été envoyé.'], 201);
    }
}
