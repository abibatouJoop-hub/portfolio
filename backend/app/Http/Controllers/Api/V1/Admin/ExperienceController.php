<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\ExperienceType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExperienceRequest;
use App\Http\Requests\Admin\UpdateExperienceRequest;
use App\Http\Resources\ExperienceResource;
use App\Models\Experience;
use App\Services\ExperienceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ExperienceController extends Controller
{
    public function __construct(private readonly ExperienceService $experiences) {}

    /** GET /api/v1/admin/experiences?type=work */
    public function index(Request $request): AnonymousResourceCollection
    {
        $type = ExperienceType::tryFrom((string) $request->query('type'));

        return ExperienceResource::collection($this->experiences->listForAdmin($type));
    }

    public function store(StoreExperienceRequest $request): JsonResponse
    {
        $experience = $this->experiences->create($request->validated());

        return ExperienceResource::make($experience)->response()->setStatusCode(201);
    }

    public function show(Experience $experience): ExperienceResource
    {
        return ExperienceResource::make($experience->load('technologies'));
    }

    public function update(UpdateExperienceRequest $request, Experience $experience): ExperienceResource
    {
        return ExperienceResource::make($this->experiences->update($experience, $request->validated()));
    }

    public function destroy(Experience $experience): Response
    {
        $this->experiences->delete($experience);

        return response()->noContent();
    }
}
