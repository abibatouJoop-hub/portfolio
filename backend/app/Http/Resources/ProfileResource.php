<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Profile;
use App\Models\SocialLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Profile */
class ProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim("{$this->first_name} {$this->last_name}"),
            'title' => $this->title,
            'hero_title' => $this->hero_title,
            'hero_subtitle' => $this->hero_subtitle,
            'main_stack' => $this->main_stack,
            'about_title' => $this->about_title,
            'about_text' => $this->about_text,
            'location' => $this->location,
            'education' => $this->education,
            'languages' => $this->languages,
            'contact_email' => $this->contact_email,
            'phone' => $this->phone,
            'is_available' => $this->is_available,
            'photo_url' => $this->publicUrl($this->photo_path),
            'cv_url' => $this->publicUrl($this->cv_path),
            'social_links' => $this->whenLoaded('socialLinks', fn () => $this->socialLinks->map(fn (SocialLink $link) => [
                'platform' => $link->platform,
                'url' => $link->url,
            ])),
            'updated_at' => $this->when($request->user() !== null, fn () => $this->updated_at?->toIso8601String()),
        ];
    }

    private function publicUrl(?string $path): ?string
    {
        return $path ? Storage::disk('public')->url($path) : null;
    }
}
