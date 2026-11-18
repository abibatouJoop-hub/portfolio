<?php

declare(strict_types=1);

namespace Tests\Feature\Site;

use App\Models\Profile;
use App\Models\SocialLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_profile_with_ordered_social_links(): void
    {
        Profile::factory()->create(['first_name' => 'Ma Aby', 'last_name' => 'Diop', 'languages' => ['Français']]);
        SocialLink::factory()->create(['platform' => 'linkedin', 'sort_order' => 2]);
        SocialLink::factory()->create(['platform' => 'github', 'sort_order' => 1]);

        $this->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.full_name', 'Ma Aby Diop')
            ->assertJsonPath('data.languages', ['Français'])
            ->assertJsonPath('data.social_links.*.platform', ['github', 'linkedin'])
            ->assertJsonPath('data.photo_url', null)
            ->assertJsonMissingPath('data.updated_at');
    }

    public function test_returns_404_when_no_profile_exists(): void
    {
        $this->getJson('/api/v1/profile')->assertNotFound();
    }
}
