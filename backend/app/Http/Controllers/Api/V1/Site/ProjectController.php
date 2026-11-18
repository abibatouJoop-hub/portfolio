<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Site;

use App\Enums\ProjectCategory;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Projets du site public : lecture seule, projets publiés uniquement. */
class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projects) {}

    /** GET /api/v1/projects?category=web */
    public function index(Request $request): AnonymousResourceCollection
    {
        $category = ProjectCategory::tryFrom((string) $request->query('category'));

        return ProjectResource::collection($this->projects->listPublished($category));
    }

    /** GET /api/v1/projects/{slug} */
    public function show(string $slug): ProjectResource
    {
        return ProjectResource::make($this->projects->findPublishedBySlug($slug));
    }
}
