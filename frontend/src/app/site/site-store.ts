import { Injectable, inject, signal } from '@angular/core';
import { ProfileApi } from '../core/api/profile.api';
import { Profile } from '../core/api/models';

/**
 * Profil public, chargé une seule fois et partagé par l'en-tête, l'accueil et le pied de page.
 */
@Injectable({ providedIn: 'root' })
export class SiteStore {
  private readonly api = inject(ProfileApi);
  private requested = false;

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);

  load(): void {
    if (this.requested) return;
    this.requested = true;

    this.api.getPublic().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
        this.requested = false; // nouvel essai à la prochaine visite
      },
    });
  }
}
