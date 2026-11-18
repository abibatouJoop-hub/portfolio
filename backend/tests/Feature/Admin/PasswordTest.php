<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['password' => 'Ancien-Passw0rd']);
        $this->actingAs($this->admin);
    }

    public function test_changes_password(): void
    {
        $this->putJson('/api/v1/admin/password', [
            'current_password' => 'Ancien-Passw0rd',
            'password' => 'Nouveau-Passw0rd',
            'password_confirmation' => 'Nouveau-Passw0rd',
        ])->assertNoContent();

        $this->assertTrue(Hash::check('Nouveau-Passw0rd', $this->admin->fresh()->password));
    }

    public function test_requires_the_correct_current_password(): void
    {
        $this->putJson('/api/v1/admin/password', [
            'current_password' => 'pas-le-bon',
            'password' => 'Nouveau-Passw0rd',
            'password_confirmation' => 'Nouveau-Passw0rd',
        ])->assertJsonValidationErrors('current_password');
    }

    public function test_new_password_must_be_strong_and_confirmed(): void
    {
        $this->putJson('/api/v1/admin/password', [
            'current_password' => 'Ancien-Passw0rd',
            'password' => 'court',
            'password_confirmation' => 'autre',
        ])->assertJsonValidationErrors('password');

        $this->putJson('/api/v1/admin/password', [
            'current_password' => 'Ancien-Passw0rd',
            'password' => 'Ancien-Passw0rd',
            'password_confirmation' => 'Ancien-Passw0rd',
        ])->assertJsonValidationErrors('password'); // identique à l'actuel

        $this->assertTrue(Hash::check('Ancien-Passw0rd', $this->admin->fresh()->password));
    }
}
