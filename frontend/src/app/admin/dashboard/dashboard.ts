import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardApi } from '../../core/api/dashboard.api';
import { MessagesApi } from '../../core/api/messages.api';
import { Dashboard as DashboardData, RecentChange } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/errors';
import { InitialsPipe, RelativeDatePipe } from '../../shared/format';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../layout/page-header';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, PageHeader, InitialsPipe, RelativeDatePipe],
  template: `
    <app-page-header title="Tableau de bord">
      <span class="avatar">{{ auth.user()?.name | initials }}</span>
    </app-page-header>

    <div class="admin-content">
      <div class="welcome">
        <div>
          <h2>Bonjour {{ firstName() }}</h2>
          <p class="muted">Voici un aperçu du contenu publié sur votre portfolio.</p>
        </div>
        <a routerLink="/admin/projets" [queryParams]="{ nouveau: 1 }" class="btn btn-primary">
          <app-icon name="plus" [size]="16" /> Nouveau projet
        </a>
      </div>

      @if (error()) {
        <p class="alert">{{ error() }}</p>
      }

      @if (data(); as d) {
        <div class="stats">
          <a routerLink="/admin/projets" class="card stat">
            <span>Projets publiés</span>
            <strong>{{ d.counters.projects_published }}</strong>
            <small>{{ d.counters.projects_draft }} brouillon{{ d.counters.projects_draft > 1 ? 's' : '' }}</small>
          </a>
          <a routerLink="/admin/competences" class="card stat">
            <span>Compétences</span>
            <strong>{{ d.counters.skills }}</strong>
            <small>Gérées par catégorie</small>
          </a>
          <a routerLink="/admin/experiences" class="card stat">
            <span>Expériences</span>
            <strong>{{ d.counters.experiences }}</strong>
            <small>Expériences, stages et formations</small>
          </a>
          <a routerLink="/admin/messages" class="card stat">
            <span>Messages non lus</span>
            <strong>{{ d.counters.messages_unread }}</strong>
            <small>Depuis le formulaire de contact</small>
          </a>
        </div>

        <div class="dashboard-grid">
          <section class="card card-pad">
            <div class="card-head">
              <h3 class="card-title">Messages récents</h3>
              <a routerLink="/admin/messages" class="link-strong">Tout voir</a>
            </div>
            @if (d.latest_messages.length === 0) {
              <p class="empty-state">Aucun message pour le moment.</p>
            } @else {
              <ul class="list">
                @for (m of d.latest_messages; track m.id) {
                  <li>
                    <a routerLink="/admin/messages" [queryParams]="{ id: m.id }" class="list-row">
                      <span class="avatar">{{ m.name | initials }}</span>
                      <span class="list-main">
                        <strong>{{ m.name }}</strong>
                        <small class="muted">{{ m.subject }}</small>
                      </span>
                      <small class="soft">{{ m.created_at | relativeDate: true }}</small>
                      <span class="unread-dot" [class.hidden]="m.is_read"></span>
                    </a>
                  </li>
                }
              </ul>
            }
          </section>

          <div class="stack">
            <section class="card card-pad">
              <h3 class="card-title">Actions rapides</h3>
              <div class="quick-actions">
                <a routerLink="/admin/projets" [queryParams]="{ nouveau: 1 }"><app-icon name="folder" /> Ajouter un projet</a>
                <a routerLink="/admin/competences"><app-icon name="layers" /> Ajouter une compétence</a>
                <a routerLink="/admin/experiences" [queryParams]="{ nouveau: 1 }"><app-icon name="briefcase" /> Ajouter une expérience</a>
              </div>
            </section>

            <section class="card card-pad">
              <h3 class="card-title">Dernières modifications</h3>
              @if (d.recent_changes.length === 0) {
                <p class="empty-state">Rien de modifié pour l'instant.</p>
              } @else {
                <ul class="list changes">
                  @for (c of d.recent_changes; track c.type + c.id) {
                    <li>
                      <a [routerLink]="link(c)" class="list-row">
                        <span class="list-main">
                          <span class="muted">{{ label(c) }} : <strong class="text">{{ c.label }}</strong></span>
                        </span>
                        <small class="soft">{{ c.updated_at | relativeDate }}</small>
                      </a>
                    </li>
                  }
                </ul>
              }
            </section>
          </div>
        </div>
      } @else if (!error()) {
        <div class="stats">
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton" style="height: 128px"></div>
          }
        </div>
      }
    </div>
  `,
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(DashboardApi);
  private readonly messages = inject(MessagesApi);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  constructor() {
    this.api.get().subscribe({
      next: (data) => {
        this.data.set(data);
        this.messages.unreadCount.set(data.counters.messages_unread);
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected label(c: RecentChange): string {
    return { project: 'Projet modifié', experience: 'Expérience modifiée', skill: 'Compétence modifiée' }[c.type];
  }

  protected link(c: RecentChange): string {
    return { project: '/admin/projets', experience: '/admin/experiences', skill: '/admin/competences' }[c.type];
  }
}
