<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Profile;
use App\Models\SocialLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Profile::factory()->create(['title' => 'Ancien titre', 'location' => 'Dakar']);
        $this->actingAs(User::factory()->create());
    }

    public function test_show_includes_admin_fields(): void
    {
        $this->getJson('/api/v1/admin/profile')
            ->assertOk()
            ->assertJsonStructure(['data' => ['updated_at', 'social_links']]);
    }

    public function test_partial_update_is_visible_on_the_public_site(): void
    {
        $this->getJson('/api/v1/profile')->assertJsonPath('data.title', 'Ancien titre'); // met en cache

        $this->putJson('/api/v1/admin/profile', ['title' => 'Développeuse full-stack', 'languages' => ['Français', 'Wolof']])
            ->assertOk()
            ->assertJsonPath('data.title', 'Développeuse full-stack')
            ->assertJsonPath('data.location', 'Dakar');

        $this->getJson('/api/v1/profile')
            ->assertJsonPath('data.title', 'Développeuse full-stack')
            ->assertJsonPath('data.languages', ['Français', 'Wolof']);
    }

    public function test_social_links_are_replaced_in_the_given_order(): void
    {
        SocialLink::factory()->create(['platform' => 'x']);
        SocialLink::factory()->create(['platform' => 'github', 'url' => 'https://github.com/ancien']);

        $this->putJson('/api/v1/admin/profile', ['social_links' => [
            ['platform' => 'LinkedIn', 'url' => 'https://www.linkedin.com/in/moi'],
            ['platform' => 'github', 'url' => 'https://github.com/moi'],
        ]])
            ->assertOk()
            ->assertJsonPath('data.social_links', [
                ['platform' => 'linkedin', 'url' => 'https://www.linkedin.com/in/moi'],
                ['platform' => 'github', 'url' => 'https://github.com/moi'],
            ]);

        $this->assertDatabaseMissing('social_links', ['platform' => 'x']);
    }

    public function test_validation(): void
    {
        $this->putJson('/api/v1/admin/profile', [
            'first_name' => '',
            'contact_email' => 'pas-un-email',
            'languages' => 'Français',
            'social_links' => [
                ['platform' => 'github', 'url' => 'pas-une-url'],
                ['platform' => 'GitHub', 'url' => 'https://github.com/x'],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'first_name', 'contact_email', 'languages',
                'social_links.0.url', 'social_links.1.platform',
            ]);
    }
}
