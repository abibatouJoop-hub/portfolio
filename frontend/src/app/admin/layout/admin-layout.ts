import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MessagesApi } from '../../core/api/messages.api';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/ui/theme.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <div class="admin-shell" [class.nav-open]="navOpen()">
      <aside class="sidebar">
        <a routerLink="/admin" class="sidebar-brand">
          <span class="logo-mark">AJ</span>
          <span>
            <strong>Portfolio</strong>
            <small>Administration</small>
          </span>
        </a>

        <nav class="sidebar-nav" aria-label="Administration">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" (click)="navOpen.set(false)">
              <app-icon [name]="item.icon" [size]="18" />
              <span>{{ item.label }}</span>
              @if (item.path === 'messages' && messages.unreadCount() > 0) {
                <span class="badge count">{{ messages.unreadCount() }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button type="button" (click)="theme.toggle()">
            <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="18" />
            {{ theme.theme() === 'dark' ? 'Mode clair' : 'Mode sombre' }}
          </button>
          <a href="/" target="_blank" rel="noopener"><app-icon name="external-link" [size]="18" /> Voir le site</a>
          <button type="button" class="text-danger" (click)="logout()">
            <app-icon name="log-out" [size]="18" /> Déconnexion
          </button>
        </div>
      </aside>

      <div class="sidebar-backdrop" (click)="navOpen.set(false)"></div>

      <div class="admin-main">
        <div class="admin-mobile-bar">
          <button type="button" class="icon-btn" (click)="navOpen.set(true)" aria-label="Ouvrir le menu">
            <app-icon name="menu" />
          </button>
          <strong>Portfolio · Admin</strong>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminLayout {
  protected readonly theme = inject(ThemeService);
  protected readonly messages = inject(MessagesApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navOpen = signal(false);

  protected readonly nav = [
    { path: 'tableau-de-bord', label: 'Tableau de bord', icon: 'grid' },
    { path: 'projets', label: 'Projets', icon: 'folder' },
    { path: 'competences', label: 'Compétences', icon: 'layers' },
    { path: 'experiences', label: 'Expériences', icon: 'briefcase' },
    { path: 'messages', label: 'Messages', icon: 'mail' },
    { path: 'profil', label: 'Profil', icon: 'user' },
    { path: 'a-propos', label: 'À propos', icon: 'info' },
  ];

  constructor() {
    this.messages.refreshUnreadCount();

    // Sur mobile, le menu se referme après chaque navigation.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.navOpen.set(false));
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigate(['/admin/connexion']));
  }
}
