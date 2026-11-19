import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/ui/theme.service';
import { Icon } from '../../shared/icon';
import { initials } from '../../shared/format';
import { SiteStore } from '../site-store';

@Component({
  selector: 'app-site-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, Icon],
  template: `
    <header class="site-header">
      <div class="container site-header-inner">
        <a routerLink="/" class="brand" (click)="menuOpen.set(false)">
          <span class="logo-mark">{{ logo() }}</span>
          <span>{{ name() }}</span>
        </a>

        <nav class="site-nav" [class.open]="menuOpen()" aria-label="Navigation principale">
          @for (link of links; track link.fragment) {
            <a routerLink="/" [fragment]="link.fragment" (click)="menuOpen.set(false)">{{ link.label }}</a>
          }
          <a routerLink="/" fragment="contact" class="btn btn-contrast sm nav-cta-mobile" (click)="menuOpen.set(false)">
            Me contacter
          </a>
        </nav>

        <div class="site-header-actions">
          <button
            type="button"
            class="icon-btn"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="16" />
          </button>
          <a routerLink="/" fragment="contact" class="btn btn-contrast nav-cta">Me contacter</a>
          <button
            type="button"
            class="icon-btn menu-toggle"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-label="Menu"
          >
            <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="18" />
          </button>
        </div>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="container site-footer-inner">
        <span>© {{ year }} {{ name() }} — Tous droits réservés</span>
        <span>Conçu et développé avec Laravel &amp; Angular</span>
      </div>
    </footer>
  `,
})
export class SiteLayout {
  protected readonly theme = inject(ThemeService);
  private readonly store = inject(SiteStore);

  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly links = [
    { fragment: 'a-propos', label: 'À propos' },
    { fragment: 'competences', label: 'Compétences' },
    { fragment: 'parcours', label: 'Expériences' },
    { fragment: 'projets', label: 'Projets' },
  ];

  protected readonly name = computed(() => this.store.profile()?.full_name || 'Portfolio');
  protected readonly logo = computed(() => initials(this.store.profile()?.full_name ?? 'Portfolio'));

  constructor() {
    this.store.load();
  }
}
