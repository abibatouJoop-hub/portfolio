import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ExperiencesApi } from '../../core/api/experiences.api';
import { Experience, experienceTypeLabel } from '../../core/api/models';
import { PeriodPipe } from '../../shared/format';

@Component({
  selector: 'app-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PeriodPipe],
  template: `
    <section id="parcours" class="section section-alt">
      <div class="container two-cols">
        <div>
          <span class="eyebrow">Parcours</span>
          <h2 class="section-title">Expériences &amp; formation</h2>
          <p class="section-lead">Mes expériences professionnelles, stages et formations, du plus récent au plus ancien.</p>
        </div>

        @if (loading()) {
          <div class="form-grid">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton" style="height: 110px"></div>
            }
          </div>
        } @else if (experiences().length === 0) {
          <p class="empty-state">Le parcours sera bientôt ajouté.</p>
        } @else {
          <ol class="timeline">
            @for (e of experiences(); track e.id) {
              <li class="timeline-item">
                <div class="timeline-meta">
                  <span class="badge">{{ label(e.type) }}</span>
                  <span class="soft">{{ e | period }}</span>
                </div>
                <h3>{{ e.title }}</h3>
                <p class="timeline-org">
                  {{ e.organization }}@if (e.location) {
                    · {{ e.location }}
                  }
                </p>
                @if (e.description) {
                  <p class="muted timeline-desc">{{ e.description }}</p>
                }
                @if (e.technologies?.length) {
                  <div class="chips">
                    @for (tech of e.technologies; track tech) {
                      <span class="chip">{{ tech }}</span>
                    }
                  </div>
                }
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
})
export class Timeline {
  private readonly api = inject(ExperiencesApi);

  protected readonly experiences = signal<Experience[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.api.listPublic().subscribe({
      next: (list) => {
        this.experiences.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected label(type: string): string {
    return experienceTypeLabel(type);
  }
}
