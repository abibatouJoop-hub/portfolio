import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ProjectsApi } from '../../core/api/projects.api';
import { Project, categoryLabel } from '../../core/api/models';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, DatePipe],
  template: `
    <section class="section project-detail">
      <div class="container narrow">
        <a routerLink="/" fragment="projets" class="back-link"><app-icon name="arrow-left" [size]="16" /> Tous les projets</a>

        @if (loading()) {
          <div class="form-grid">
            <div class="skeleton" style="height: 40px; width: 60%"></div>
            <div class="skeleton" style="height: 360px"></div>
          </div>
        } @else if (notFound()) {
          <div class="empty-state">
            <h1>Projet introuvable</h1>
            <p>Ce projet n'existe pas ou n'est plus publié.</p>
            <a routerLink="/" class="btn btn-primary">Retour à l'accueil</a>
          </div>
        } @else if (project(); as p) {
          <header class="project-detail-head">
            <span class="badge">{{ label(p.category) }}</span>
            <h1>{{ p.title }}</h1>
            <p class="section-lead">{{ p.summary }}</p>
            <div class="hero-actions">
              @if (p.demo_url) {
                <a [href]="p.demo_url" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  <app-icon name="external-link" [size]="16" /> Voir la démo
                </a>
              }
              @if (p.repo_url) {
                <a [href]="p.repo_url" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
                  <app-icon name="github" [size]="16" /> Code source
                </a>
              }
            </div>
          </header>

          <div class="project-detail-cover">
            @if (p.cover_url) {
              <img [src]="p.cover_url" [alt]="'Capture du projet ' + p.title" />
            } @else {
              <span class="photo-placeholder"><app-icon name="image" [size]="24" /> Capture du projet</span>
            }
          </div>

          <div class="project-detail-body">
            <div>
              @if (p.description) {
                <p class="pre-line">{{ p.description }}</p>
              } @else {
                <p class="muted">{{ p.summary }}</p>
              }
            </div>
            <aside class="card card-pad">
              @if (p.technologies?.length) {
                <h3 class="aside-title">Technologies</h3>
                <div class="chips">
                  @for (tech of p.technologies; track tech) {
                    <span class="chip">{{ tech }}</span>
                  }
                </div>
              }
              @if (p.published_at) {
                <h3 class="aside-title">Publié le</h3>
                <p class="muted">{{ p.published_at | date: 'longDate' }}</p>
              }
            </aside>
          </div>
        }
      </div>
    </section>
  `,
})
export class ProjectDetail {
  private readonly api = inject(ProjectsApi);
  private readonly title = inject(Title);

  /** Paramètre de route :slug (withComponentInputBinding). */
  readonly slug = input.required<string>();

  protected readonly project = signal<Project | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  constructor() {
    // Recharge quand le slug change ; la requête précédente est annulée.
    effect((onCleanup) => {
      const slug = this.slug();
      this.loading.set(true);
      this.notFound.set(false);

      const sub = this.api.findBySlug(slug).subscribe({
        next: (project) => {
          this.project.set(project);
          this.loading.set(false);
          this.title.setTitle(`${project.title} · Projets`);
        },
        error: () => {
          // 404 (brouillon, slug inconnu) ou API indisponible : même écran.
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected label(category: string): string {
    return categoryLabel(category);
  }
}
