<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private const GENERIC_MESSAGE = 'Si un compte correspond à cette adresse, un lien de réinitialisation vient d\'être envoyé.';

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'admin@example.com', 'password' => 'Ancien-Passw0rd']);
    }

    // ---------------------------------------------------------------- Demande du lien

    public function test_forgot_password_sends_a_link_to_the_angular_page(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.com'])
            ->assertOk()
            ->assertExactJson(['message' => self::GENERIC_MESSAGE]);

        Notification::assertSentTo($this->admin, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) {
            $mail = $notification->toMail($this->admin);

            return $mail->subject === 'Portfolio — réinitialisation du mot de passe'
                && str_starts_with($mail->actionUrl, 'http://localhost:4200/admin/reset-password?token=')
                && str_contains($mail->actionUrl, 'email=admin%40example.com');
        });
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'admin@example.com']);
    }

    public function test_unknown_email_gets_the_same_answer_and_no_email(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'inconnu@example.com'])
            ->assertOk()
            ->assertExactJson(['message' => self::GENERIC_MESSAGE]);

        Notification::assertNothingSent();
    }

    public function test_the_email_is_queued(): void
    {
        $this->assertContains(ShouldQueue::class, class_implements(ResetPasswordNotification::class));
    }

    public function test_forgot_password_validation_and_rate_limit(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'pas-un-email'])
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.com'])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.com'])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.com'])->assertTooManyRequests();
    }

    // ---------------------------------------------------------------- Nouveau mot de passe

    public function test_reset_password_with_a_valid_token(): void
    {
        $token = Password::broker()->createToken($this->admin);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'admin@example.com',
            'password' => 'Nouveau-Passw0rd',
            'password_confirmation' => 'Nouveau-Passw0rd',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Votre mot de passe a été modifié. Vous pouvez vous connecter.');

        $this->assertTrue(Hash::check('Nouveau-Passw0rd', $this->admin->fresh()->password));
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'admin@example.com']);
    }

    public function test_a_token_can_only_be_used_once(): void
    {
        $token = Password::broker()->createToken($this->admin);
        $payload = ['token' => $token, 'email' => 'admin@example.com', 'password' => 'Nouveau-Passw0rd', 'password_confirmation' => 'Nouveau-Passw0rd'];

        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertJsonValidationErrors('email');
    }

    public function test_invalid_or_expired_token_is_rejected(): void
    {
        $token = Password::broker()->createToken($this->admin);
        $payload = ['email' => 'admin@example.com', 'password' => 'Nouveau-Passw0rd', 'password_confirmation' => 'Nouveau-Passw0rd'];

        $this->postJson('/api/v1/auth/reset-password', [...$payload, 'token' => 'faux-jeton'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau.']);

        $this->travel(61)->minutes();
        $this->postJson('/api/v1/auth/reset-password', [...$payload, 'token' => $token])
            ->assertJsonValidationErrors('email');

        $this->assertTrue(Hash::check('Ancien-Passw0rd', $this->admin->fresh()->password));
    }

    public function test_new_password_must_be_strong_and_confirmed(): void
    {
        $token = Password::broker()->createToken($this->admin);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'admin@example.com',
            'password' => 'court',
            'password_confirmation' => 'different',
        ])->assertJsonValidationErrors('password');
    }

    public function test_reset_logs_out_every_existing_session(): void
    {
        config(['session.driver' => 'database']);
        DB::table('sessions')->insert([
            ['id' => 'session-volee', 'user_id' => $this->admin->id, 'payload' => '', 'last_activity' => time()],
            ['id' => 'autre-utilisateur', 'user_id' => null, 'payload' => '', 'last_activity' => time()],
        ]);
        $rememberToken = $this->admin->remember_token;

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => Password::broker()->createToken($this->admin),
            'email' => 'admin@example.com',
            'password' => 'Nouveau-Passw0rd',
            'password_confirmation' => 'Nouveau-Passw0rd',
        ])->assertOk();

        $this->assertDatabaseMissing('sessions', ['id' => 'session-volee']);
        $this->assertDatabaseHas('sessions', ['id' => 'autre-utilisateur']);
        $this->assertNotSame($rememberToken, $this->admin->fresh()->remember_token);
    }
}
