import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SkillsApi } from '../../core/api/skills.api';
import { SkillCategory, skillLevelLabel } from '../../core/api/models';
import { categoryBadge } from '../../shared/format';

@Component({
  selector: 'app-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="competences" class="section">
      <div class="container">
        <header class="section-head">
          <span class="eyebrow">Compétences</span>
          <h2 class="section-title">Les technologies que j'utilise au quotidien</h2>
          <p class="section-lead">Liste mise à jour depuis mon espace d'administration à chaque nouvel apprentissage.</p>
        </header>

        @if (loading()) {
          <div class="cards-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton" style="height: 220px"></div>
            }
          </div>
        } @else if (categories().length === 0) {
          <p class="empty-state">Les compétences seront bientôt ajoutées.</p>
        } @else {
          <div class="cards-3">
            @for (category of categories(); track category.id) {
              <article class="card skill-card">
                <h3>
                  <span class="skill-badge">{{ badge(category.name) }}</span>
                  {{ category.name }}
                </h3>
                <ul>
                  @for (skill of category.skills ?? []; track skill.id) {
                    <li>
                      <div class="skill-line">
                        <span>{{ skill.name }}</span>
                        <small>{{ level(skill.level) }}</small>
                      </div>
                      <div
                        class="progress"
                        role="progressbar"
                        [attr.aria-valuenow]="skill.level"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        [attr.aria-label]="skill.name"
                      >
                        <span [style.width.%]="skill.level"></span>
                      </div>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class Skills {
  private readonly api = inject(SkillsApi);

  protected readonly categories = signal<SkillCategory[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.api.listVisibleGrouped().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected badge(name: string): string {
    return categoryBadge(name);
  }

  protected level(level: number): string {
    return skillLevelLabel(level);
  }
}
