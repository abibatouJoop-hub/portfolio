<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** Gestion des projets dans l'admin : reçoit, délègue au service, répond. */
class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projects) {}

    /** GET /api/v1/admin/projects?status=draft */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = ProjectStatus::tryFrom((string) $request->query('status'));

        return ProjectResource::collection($this->projects->listForAdmin($status));
    }

    /** POST /api/v1/admin/projects */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->projects->create($request->validated());

        return ProjectResource::make($project)->response()->setStatusCode(201);
    }

    /** GET /api/v1/admin/projects/{project} */
    public function show(Project $project): ProjectResource
    {
        return ProjectResource::make($project->load('technologies'));
    }

    /** PUT /api/v1/admin/projects/{project} */
    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        return ProjectResource::make($this->projects->update($project, $request->validated()));
    }

    /** DELETE /api/v1/admin/projects/{project} */
    public function destroy(Project $project): Response
    {
        $this->projects->delete($project);

        return response()->noContent();
    }

    /** POST /api/v1/admin/projects/{project}/cover  (FormData, champ « file ») */
    public function uploadCover(UploadImageRequest $request, Project $project): ProjectResource
    {
        return ProjectResource::make($this->projects->updateCover($project, $request->file('file')));
    }

    /** DELETE /api/v1/admin/projects/{project}/cover */
    public function deleteCover(Project $project): ProjectResource
    {
        return ProjectResource::make($this->projects->removeCover($project));
    }

    /** PATCH /api/v1/admin/projects/reorder  { "ids": [3, 1, 2] } */
    public function reorder(ReorderRequest $request): Response
    {
        $this->projects->reorder($request->validated('ids'));

        return response()->noContent();
    }
}
