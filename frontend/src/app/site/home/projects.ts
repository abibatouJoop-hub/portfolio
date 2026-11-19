import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectsApi } from '../../core/api/projects.api';
import { PROJECT_CATEGORIES, Project, ProjectCategory, categoryLabel } from '../../core/api/models';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <section id="projets" class="section">
      <div class="container">
        <header class="section-head row">
          <div>
            <span class="eyebrow">Projets</span>
            <h2 class="section-title">Une sélection de mes réalisations</h2>
          </div>
          <div class="pills" role="tablist" aria-label="Filtrer par catégorie">
            <button type="button" class="pill" role="tab" [class.active]="!filter()" [attr.aria-selected]="!filter()" (click)="filter.set(null)">
              Tous
            </button>
            @for (c of categories; track c.value) {
              <button
                type="button"
                class="pill"
                role="tab"
                [class.active]="filter() === c.value"
                [attr.aria-selected]="filter() === c.value"
                (click)="filter.set(c.value)"
              >
                {{ c.label }}
              </button>
            }
          </div>
        </header>

        @if (loading()) {
          <div class="cards-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton" style="height: 360px"></div>
            }
          </div>
        } @else if (visible().length === 0) {
          <p class="empty-state">Aucun projet dans cette catégorie pour le moment.</p>
        } @else {
          <div class="cards-3">
            @for (p of visible(); track p.id) {
              <article class="card project-card">
                <a [routerLink]="['/projets', p.slug]" class="project-cover" [attr.aria-label]="p.title">
                  @if (p.cover_url) {
                    <img [src]="p.cover_url" [alt]="'Capture du projet ' + p.title" loading="lazy" />
                  } @else {
                    <span class="photo-placeholder"><app-icon name="image" [size]="18" /> Capture du projet</span>
                  }
                </a>
                <div class="project-body">
                  <span class="project-category">{{ label(p.category) }}</span>
                  <h3><a [routerLink]="['/projets', p.slug]">{{ p.title }}</a></h3>
                  <p class="muted">{{ p.summary }}</p>
                  @if (p.technologies?.length) {
                    <div class="chips">
                      @for (tech of p.technologies; track tech) {
                        <span class="chip">{{ tech }}</span>
                      }
                    </div>
                  }
                  <div class="project-links">
                    @if (p.demo_url) {
                      <a [href]="p.demo_url" target="_blank" rel="noopener noreferrer">
                        <app-icon name="external-link" [size]="14" /> Démo
                      </a>
                    }
                    @if (p.repo_url) {
                      <a [href]="p.repo_url" target="_blank" rel="noopener noreferrer" class="link-muted">
                        <app-icon name="code" [size]="14" /> Code source
                      </a>
                    }
                    @if (!p.demo_url && !p.repo_url) {
                      <a [routerLink]="['/projets', p.slug]">En savoir plus <app-icon name="arrow-right" [size]="14" /></a>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class Projects {
  private readonly api = inject(ProjectsApi);

  protected readonly categories = PROJECT_CATEGORIES;
  protected readonly filter = signal<ProjectCategory | null>(null);
  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(true);

  /** Filtrage côté client : tous les projets publiés sont chargés une fois (et mis en cache côté API). */
  protected readonly visible = computed(() => {
    const filter = this.filter();
    return filter ? this.projects().filter((p) => p.category === filter) : this.projects();
  });

  constructor() {
    this.api.listPublished().subscribe({
      next: (list) => {
        this.projects.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected label(category: string): string {
    return categoryLabel(category);
  }
}
