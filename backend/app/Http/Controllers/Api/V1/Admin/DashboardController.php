<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

/** Contrôleur à action unique (__invoke) : une seule route, GET /admin/dashboard. */
class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard) {}

    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'counters' => $this->dashboard->counters(),
            'latest_messages' => ContactMessageResource::collection($this->dashboard->latestMessages()),
            'recent_changes' => $this->dashboard->recentChanges(),
        ]]);
    }
}
