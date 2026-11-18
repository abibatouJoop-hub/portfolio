<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSkillCategoryRequest;
use App\Http\Requests\Admin\UpdateSkillCategoryRequest;
use App\Http\Resources\SkillCategoryResource;
use App\Models\SkillCategory;
use App\Services\SkillService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SkillCategoryController extends Controller
{
    public function __construct(private readonly SkillService $skills) {}

    public function index(): AnonymousResourceCollection
    {
        return SkillCategoryResource::collection($this->skills->listCategories());
    }

    public function store(StoreSkillCategoryRequest $request): JsonResponse
    {
        $category = $this->skills->createCategory($request->validated());

        return SkillCategoryResource::make($category)->response()->setStatusCode(201);
    }

    public function show(SkillCategory $skillCategory): SkillCategoryResource
    {
        return SkillCategoryResource::make($skillCategory->load('skills'));
    }

    public function update(UpdateSkillCategoryRequest $request, SkillCategory $skillCategory): SkillCategoryResource
    {
        return SkillCategoryResource::make($this->skills->updateCategory($skillCategory, $request->validated()));
    }

    public function destroy(SkillCategory $skillCategory): Response
    {
        $this->skills->deleteCategory($skillCategory);

        return response()->noContent();
    }
}
