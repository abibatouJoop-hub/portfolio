<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profile) {}

    /** GET /api/v1/profile — accueil, à propos, pied de page, réseaux */
    public function show(): ProfileResource
    {
        return ProfileResource::make($this->profile->getPublic());
    }
}
