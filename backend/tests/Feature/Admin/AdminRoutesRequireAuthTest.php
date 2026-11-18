<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Filet de sécurité : TOUTE route sous /api/v1/admin — y compris celles ajoutées
 * plus tard — doit répondre 401 à un invité. Si quelqu'un oublie auth:sanctum,
 * ce test échoue.
 */
class AdminRoutesRequireAuthTest extends TestCase
{
    public function test_every_admin_route_rejects_guests(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn (RoutingRoute $route) => str_starts_with($route->uri(), 'api/v1/admin'));

        $this->assertGreaterThan(20, $routes->count(), 'Les routes admin devraient être enregistrées.');

        foreach ($routes as $route) {
            $uri = preg_replace('/\{[^}]+\}/', '1', $route->uri());

            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $this->json($method, $uri)->assertUnauthorized();
            }
        }
    }
}
