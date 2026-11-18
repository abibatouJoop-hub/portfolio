<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderRequest;
use App\Http\Requests\Admin\StoreSkillRequest;
use App\Http\Requests\Admin\UpdateSkillRequest;
use App\Http\Resources\SkillResource;
use App\Models\Skill;
use App\Services\SkillService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SkillController extends Controller
{
    public function __construct(private readonly SkillService $skills) {}

    /** GET /api/v1/admin/skills?category=2 */
    public function index(Request $request): AnonymousResourceCollection
    {
        $categoryId = filter_var($request->query('category'), FILTER_VALIDATE_INT) ?: null;

        return SkillResource::collection($this->skills->listSkills($categoryId));
    }

    public function store(StoreSkillRequest $request): JsonResponse
    {
        $skill = $this->skills->createSkill($request->validated());

        return SkillResource::make($skill)->response()->setStatusCode(201);
    }

    public function show(Skill $skill): SkillResource
    {
        return SkillResource::make($skill);
    }

    public function update(UpdateSkillRequest $request, Skill $skill): SkillResource
    {
        return SkillResource::make($this->skills->updateSkill($skill, $request->validated()));
    }

    public function destroy(Skill $skill): Response
    {
        $this->skills->deleteSkill($skill);

        return response()->noContent();
    }

    /** PATCH /api/v1/admin/skills/reorder  { "ids": [5, 2, 9] } */
    public function reorder(ReorderRequest $request): Response
    {
        $this->skills->reorder($request->validated('ids'));

        return response()->noContent();
    }
}
