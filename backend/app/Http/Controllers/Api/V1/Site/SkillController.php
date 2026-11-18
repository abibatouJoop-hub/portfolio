<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Site;

use App\Http\Controllers\Controller;
use App\Http\Resources\SkillCategoryResource;
use App\Services\SkillService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SkillController extends Controller
{
    public function __construct(private readonly SkillService $skills) {}

    /** GET /api/v1/skills — compétences visibles, groupées par catégorie */
    public function index(): AnonymousResourceCollection
    {
        return SkillCategoryResource::collection($this->skills->listVisibleGrouped());
    }
}
