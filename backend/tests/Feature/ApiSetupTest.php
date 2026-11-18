<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class ApiSetupTest extends TestCase
{
    public function test_csrf_cookie_route_sets_xsrf_cookie(): void
    {
        $this->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN');
    }

    public function test_cors_allows_angular_origin_with_credentials(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:4200'])
            ->get('/sanctum/csrf-cookie')
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_unknown_api_route_returns_json_404(): void
    {
        $this->get('/api/v1/inexistant')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }
}
