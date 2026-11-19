import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../core/api/models';
import { Icon, socialIcon } from '../../shared/icon';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-text">
          @if (profile().is_available) {
            <span class="badge availability"><span class="dot"></span>Disponible pour de nouvelles opportunités</span>
          }

          <h1>
            {{ heroTitle() }}
            <span class="accent">{{ profile().title }}</span>
          </h1>

          @if (profile().hero_subtitle) {
            <p class="hero-subtitle">{{ profile().hero_subtitle }}</p>
          }

          <div class="hero-actions">
            <a routerLink="/" fragment="projets" class="btn btn-primary lg">
              Voir mes projets <app-icon name="arrow-right" [size]="16" />
            </a>
            @if (profile().cv_url) {
              <a [href]="profile().cv_url" class="btn btn-outline lg" target="_blank" rel="noopener" download>
                <app-icon name="download" [size]="16" /> Télécharger mon CV
              </a>
            }
          </div>

          <div class="hero-socials">
            @for (link of profile().social_links ?? []; track link.platform) {
              <a [href]="link.url" class="icon-btn" target="_blank" rel="noopener noreferrer" [attr.aria-label]="link.platform">
                <app-icon [name]="icon(link.platform)" [size]="16" />
              </a>
            }
            @if (profile().contact_email) {
              <a [href]="'mailto:' + profile().contact_email" class="icon-btn" aria-label="E-mail">
                <app-icon name="mail" [size]="16" />
              </a>
            }
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-photo">
            @if (profile().photo_url) {
              <img [src]="profile().photo_url" [alt]="'Photo de ' + profile().full_name" />
            } @else {
              <div class="photo-placeholder">
                <app-icon name="image" [size]="28" />
                <span>{{ profile().full_name }}</span>
              </div>
            }
          </div>
          @if (profile().main_stack) {
            <div class="stack-badge card">
              <small>Stack principale</small>
              <strong>{{ profile().main_stack }}</strong>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class Hero {
  readonly profile = input.required<Profile>();

  protected readonly heroTitle = computed(
    () => this.profile().hero_title || `Bonjour, je suis ${this.profile().first_name}.`,
  );

  protected icon(platform: string): string {
    return socialIcon(platform);
  }
}
