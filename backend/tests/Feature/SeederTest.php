<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\ProfileSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'portfolio.admin.email' => 'admin@example.com',
            'portfolio.admin.password' => 'secret-initial',
        ]);
    }

    public function test_admin_seeder_creates_single_admin_with_hashed_password(): void
    {
        $this->seed(AdminUserSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $this->assertSame(1, User::count());
        $admin = User::first();
        $this->assertSame('admin@example.com', $admin->email);
        $this->assertNotSame('secret-initial', $admin->password);
        $this->assertTrue(Hash::check('secret-initial', $admin->password));
    }

    public function test_admin_seeder_does_not_overwrite_a_changed_password(): void
    {
        $this->seed(AdminUserSeeder::class);
        User::first()->update(['password' => 'changed-in-admin']);

        $this->seed(AdminUserSeeder::class);

        $this->assertTrue(Hash::check('changed-in-admin', User::first()->password));
    }

    public function test_admin_seeder_fails_without_credentials(): void
    {
        config(['portfolio.admin.password' => null]);

        $this->expectException(RuntimeException::class);
        $this->seed(AdminUserSeeder::class);
    }

    public function test_profile_seeder_does_not_overwrite_existing_profile(): void
    {
        $this->seed(ProfileSeeder::class);
        Profile::first()->update(['title' => 'Modifié dans l\'admin']);

        $this->seed(ProfileSeeder::class);

        $this->assertSame(1, Profile::count());
        $this->assertSame('Modifié dans l\'admin', Profile::first()->title);
    }
}
