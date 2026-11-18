<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExperienceResource;
use App\Services\ExperienceService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExperienceController extends Controller
{
    public function __construct(private readonly ExperienceService $experiences) {}

    /** GET /api/v1/experiences — du plus récent au plus ancien */
    public function index(): AnonymousResourceCollection
    {
        return ExperienceResource::collection($this->experiences->listPublic());
    }
}
