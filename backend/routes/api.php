<?php

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Site;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
| Toutes les routes sont préfixées par /api/v1 (le préfixe /api est ajouté
| automatiquement par Laravel). Deux zones :
|  - publique (site Angular, lecture seule + formulaire de contact)
|  - admin (protégée par auth:sanctum)
*/

Route::prefix('v1')->group(function () {
    // ------------------------------------------------------------ Site public
    Route::get('profile', [Site\ProfileController::class, 'show']);
    Route::get('skills', [Site\SkillController::class, 'index']);
    Route::get('experiences', [Site\ExperienceController::class, 'index']);
    Route::get('projects', [Site\ProjectController::class, 'index']);
    Route::get('projects/{slug}', [Site\ProjectController::class, 'show']);
    Route::post('contact', [Site\ContactController::class, 'store'])->middleware('throttle:contact');

    // ------------------------------------------------------------ Authentification
    // Avant le login, Angular appelle GET /sanctum/csrf-cookie (route fournie par Sanctum).
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
    });

    // ------------------------------------------------------------ Admin
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::get('dashboard', Admin\DashboardController::class);
        Route::put('password', [AuthController::class, 'updatePassword']);

        // Les routes « reorder » sont déclarées AVANT apiResource,
        // sinon « reorder » serait pris pour un identifiant ({project}, {skill}).
        Route::patch('projects/reorder', [Admin\ProjectController::class, 'reorder']);
        Route::apiResource('projects', Admin\ProjectController::class);
        Route::post('projects/{project}/cover', [Admin\ProjectController::class, 'uploadCover']);
        Route::delete('projects/{project}/cover', [Admin\ProjectController::class, 'deleteCover']);

        Route::apiResource('skill-categories', Admin\SkillCategoryController::class);
        Route::patch('skills/reorder', [Admin\SkillController::class, 'reorder']);
        Route::apiResource('skills', Admin\SkillController::class);

        Route::apiResource('experiences', Admin\ExperienceController::class);

        Route::apiResource('messages', Admin\ContactMessageController::class)
            ->only(['index', 'show', 'update', 'destroy'])
            ->parameters(['messages' => 'contactMessage']);

        Route::get('profile', [Admin\ProfileController::class, 'show']);
        Route::put('profile', [Admin\ProfileController::class, 'update']);
        Route::post('profile/photo', [Admin\ProfileController::class, 'uploadPhoto']);
        Route::delete('profile/photo', [Admin\ProfileController::class, 'deletePhoto']);
        Route::post('profile/cv', [Admin\ProfileController::class, 'uploadCv']);
        Route::delete('profile/cv', [Admin\ProfileController::class, 'deleteCv']);
    });
});
