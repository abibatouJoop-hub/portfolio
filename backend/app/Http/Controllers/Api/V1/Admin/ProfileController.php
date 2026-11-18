<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Http\Requests\Admin\UploadCvRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Http\Resources\ProfileResource;
use App\Services\ProfileService;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profile) {}

    /** GET /api/v1/admin/profile — lu en base (pas en cache) pour éditer la dernière version */
    public function show(): ProfileResource
    {
        return ProfileResource::make($this->profile->get());
    }

    /** PUT /api/v1/admin/profile */
    public function update(UpdateProfileRequest $request): ProfileResource
    {
        return ProfileResource::make($this->profile->update($request->validated()));
    }

    /** POST /api/v1/admin/profile/photo  (FormData, champ « file ») */
    public function uploadPhoto(UploadImageRequest $request): ProfileResource
    {
        return ProfileResource::make($this->profile->replaceFile('photo', $request->file('file')));
    }

    /** DELETE /api/v1/admin/profile/photo */
    public function deletePhoto(): ProfileResource
    {
        return ProfileResource::make($this->profile->removeFile('photo'));
    }

    /** POST /api/v1/admin/profile/cv  (FormData, champ « file », PDF) */
    public function uploadCv(UploadCvRequest $request): ProfileResource
    {
        return ProfileResource::make($this->profile->replaceFile('cv', $request->file('file')));
    }

    /** DELETE /api/v1/admin/profile/cv */
    public function deleteCv(): ProfileResource
    {
        return ProfileResource::make($this->profile->removeFile('cv'));
    }
}
