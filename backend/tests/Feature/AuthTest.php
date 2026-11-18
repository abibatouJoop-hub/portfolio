<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'admin@example.com', 'password' => 'Secret-Passw0rd']);

        // Simule une requête venant d'Angular : Sanctum active alors la session (mode SPA).
        $this->withHeaders(['Referer' => 'http://localhost:4200', 'Origin' => 'http://localhost:4200']);
    }

    public function test_spa_login_flow_csrf_cookie_then_login_then_me(): void
    {
        $this->get('/sanctum/csrf-cookie')->assertNoContent()->assertCookie('XSRF-TOKEN');

        $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'Secret-Passw0rd'])
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@example.com')
            ->assertJsonMissingPath('data.password')
            ->assertCookie(config('session.cookie'));

        $this->assertAuthenticatedAs($this->admin, 'web');
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $this->admin->id);
    }

    public function test_wrong_password_returns_422_with_a_vague_message(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'mauvais'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Identifiants incorrects.']);

        $this->assertGuest('web');
    }

    public function test_unknown_email_gives_the_same_message(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'inconnu@example.com', 'password' => 'Secret-Passw0rd'])
            ->assertJsonValidationErrors(['email' => 'Identifiants incorrects.']);
    }

    public function test_login_is_limited_to_5_attempts_per_minute(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => "essai-{$attempt}"])
                ->assertUnprocessable();
        }

        // 6e essai, même avec le bon mot de passe : bloqué.
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.com', 'password' => 'Secret-Passw0rd'])
            ->assertTooManyRequests();
    }

    public function test_logout(): void
    {
        $this->actingAs($this->admin, 'web');

        $this->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    }
}
