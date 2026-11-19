import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExperiencePayload, ExperiencesApi } from '../../core/api/experiences.api';
import { EXPERIENCE_TYPES, Experience, ExperienceType, experienceTypeLabel } from '../../core/api/models';
import { applyServerErrors, controlError, errorMessage } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { PeriodPipe } from '../../shared/format';
import { Icon } from '../../shared/icon';
import { TagInput } from '../../shared/tag-input';
import { PageHeader } from '../layout/page-header';

@Component({
  selector: 'app-admin-experiences',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeader, Icon, TagInput, PeriodPipe],
  template: `
    <app-page-header title="Expériences & formation" section="Expériences">
      <button type="button" class="btn btn-primary" (click)="startCreate()">
        <app-icon name="plus" [size]="16" /> Nouvelle entrée
      </button>
    </app-page-header>

    <div class="admin-content split" [class.with-panel]="editing()">
      <div class="stack">
        <div class="pills">
          <button type="button" class="pill" [class.active]="!filter()" (click)="filter.set(null)">Tout ({{ experiences().length }})</button>
          @for (t of types; track t.value) {
            <button type="button" class="pill" [class.active]="filter() === t.value" (click)="filter.set(t.value)">
              {{ t.plural }} ({{ count(t.value) }})
            </button>
          }
        </div>

        @if (loading()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton" style="height: 96px"></div>
          }
        } @else {
          @for (e of visible(); track e.id) {
            <article class="card experience-row" [class.selected]="selected()?.id === e.id">
              <span class="experience-icon">
                <app-icon [name]="e.type === 'education' ? 'graduation-cap' : 'briefcase'" />
              </span>
              <div class="experience-main">
                <div class="timeline-meta">
                  <span class="badge">{{ label(e.type) }}</span>
                  @if (e.is_current) {
                    <span class="badge warning">En cours</span>
                  }
                  <span class="soft">{{ e | period }}</span>
                </div>
                <h3>{{ e.title }}</h3>
                <p class="muted">
                  {{ e.organization }}@if (e.location) {
                    · {{ e.location }}
                  }
                </p>
              </div>
              <div class="row-actions">
                <button type="button" class="icon-btn" (click)="startEdit(e)" [attr.aria-label]="'Modifier ' + e.title">
                  <app-icon name="pencil" [size]="15" />
                </button>
                <button type="button" class="icon-btn danger" (click)="remove(e)" [attr.aria-label]="'Supprimer ' + e.title">
                  <app-icon name="trash" [size]="15" />
                </button>
              </div>
            </article>
          } @empty {
            <div class="card empty-state">
              <app-icon name="briefcase" [size]="28" />
              <p>Aucune entrée{{ filter() ? ' de ce type' : '' }} pour le moment.</p>
            </div>
          }
        }
      </div>

      @if (editing()) {
        <section class="card card-pad editor">
          <div>
            <h2 class="card-title">{{ selected() ? "Modifier l'entrée" : 'Nouvelle entrée' }}</h2>
            <p class="card-subtitle">Affichée dans la frise « Parcours » du site.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid" novalidate>
            <div class="field">
              <span class="label">Type</span>
              <div class="radio-cards" role="radiogroup">
                @for (t of types; track t.value) {
                  <label [class.active]="form.controls.type.value === t.value">
                    <input type="radio" formControlName="type" [value]="t.value" /> {{ t.label }}
                  </label>
                }
              </div>
            </div>

            <div class="field">
              <label for="e-title">{{ form.controls.type.value === 'education' ? 'Diplôme' : 'Poste' }}</label>
              <input id="e-title" class="input" formControlName="title" />
              @if (err('title'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>

            <div class="form-row">
              <div class="field">
                <label for="e-org">{{ form.controls.type.value === 'education' ? 'École' : 'Entreprise' }}</label>
                <input id="e-org" class="input" formControlName="organization" />
                @if (err('organization'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
              <div class="field">
                <label for="e-location">Lieu</label>
                <input id="e-location" class="input" formControlName="location" placeholder="Ville" />
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="e-start">Date de début</label>
                <input id="e-start" type="date" class="input" formControlName="start_date" />
                @if (err('start_date'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
              <div class="field">
                <label for="e-end">Date de fin</label>
                <input id="e-end" type="date" class="input" formControlName="end_date" [min]="form.controls.start_date.value" />
                @if (err('end_date'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
            </div>

            <label class="checkbox">
              <input type="checkbox" formControlName="is_current" />
              {{ form.controls.type.value === 'education' ? 'Formation en cours' : "J'occupe actuellement ce poste" }}
            </label>

            <div class="field">
              <label for="e-desc">Description</label>
              <textarea id="e-desc" class="input" rows="4" formControlName="description" placeholder="Missions, réalisations, résultats…"></textarea>
            </div>

            <div class="field">
              <label for="e-tech">Technologies utilisées</label>
              <app-tag-input inputId="e-tech" formControlName="technologies" placeholder="Laravel, Angular, PostgreSQL…" />
            </div>

            @if (formError()) {
              <p class="alert">{{ formError() }}</p>
            }

            <div class="editor-actions">
              <button type="button" class="btn btn-outline" (click)="close()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner"></span>
                }
                Enregistrer
              </button>
            </div>
          </form>
        </section>
      }
    </div>
  `,
})
export class AdminExperiences implements OnInit {
  private readonly api = inject(ExperiencesApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly nouveau = input<string>();

  protected readonly types = EXPERIENCE_TYPES;
  protected readonly experiences = signal<Experience[]>([]);
  protected readonly loading = signal(true);
  protected readonly filter = signal<ExperienceType | null>(null);

  protected readonly editing = signal(false);
  protected readonly selected = signal<Experience | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly visible = computed(() => {
    const f = this.filter();
    return f ? this.experiences().filter((e) => e.type === f) : this.experiences();
  });

  protected readonly form = this.fb.group({
    type: ['work' as ExperienceType, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    organization: ['', [Validators.required, Validators.maxLength(150)]],
    location: ['', Validators.maxLength(120)],
    start_date: ['', Validators.required],
    end_date: [''],
    is_current: [false],
    description: [''],
    technologies: [[] as string[]],
  });

  constructor() {
    // « En cours » : pas de date de fin.
    this.form.controls.is_current.valueChanges.pipe(takeUntilDestroyed()).subscribe((current) => {
      const end = this.form.controls.end_date;
      if (current) {
        end.setValue('');
        end.disable();
      } else {
        end.enable();
      }
    });

    this.api.list().subscribe({
      next: (list) => {
        this.experiences.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  ngOnInit(): void {
    if (this.nouveau()) this.startCreate();
  }

  protected label(type: string): string {
    return experienceTypeLabel(type);
  }

  protected count(type: ExperienceType): number {
    return this.experiences().filter((e) => e.type === type).length;
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected startCreate(): void {
    this.selected.set(null);
    this.formError.set(null);
    this.form.reset({ type: this.filter() ?? 'work', technologies: [], is_current: false });
    this.editing.set(true);
  }

  protected startEdit(e: Experience): void {
    this.selected.set(e);
    this.formError.set(null);
    this.form.reset({
      type: e.type,
      title: e.title,
      organization: e.organization,
      location: e.location ?? '',
      start_date: e.start_date,
      end_date: e.end_date ?? '',
      is_current: e.is_current,
      description: e.description ?? '',
      technologies: e.technologies ?? [],
    });
    this.editing.set(true);
  }

  protected close(): void {
    this.editing.set(false);
    this.selected.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    if (!v.is_current && v.end_date && v.end_date < v.start_date) {
      this.form.controls.end_date.setErrors({ server: 'La date de fin doit être postérieure à la date de début.' });
      this.form.controls.end_date.markAsTouched();
      return;
    }

    const payload: ExperiencePayload = {
      type: v.type,
      title: v.title.trim(),
      organization: v.organization.trim(),
      location: v.location.trim() || null,
      start_date: v.start_date,
      end_date: v.is_current ? null : v.end_date || null,
      is_current: v.is_current,
      description: v.description.trim() || null,
      technologies: v.technologies,
    };

    const current = this.selected();
    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.experiences.update((list) => {
          const next = current ? list.map((e) => (e.id === saved.id ? saved : e)) : [...list, saved];
          // Même ordre que l'API : en cours d'abord, puis du plus récent au plus ancien.
          return next.sort(
            (a, b) => Number(b.is_current) - Number(a.is_current) || b.start_date.localeCompare(a.start_date),
          );
        });
        this.selected.set(saved);
        this.toast.success(current ? 'Entrée enregistrée.' : 'Entrée ajoutée au parcours.');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const rest = applyServerErrors(this.form, err);
        this.formError.set(Object.values(rest)[0] ?? errorMessage(err));
      },
    });
  }

  protected remove(e: Experience): void {
    if (!confirm(`Supprimer « ${e.title} » du parcours ?`)) return;
    this.api.delete(e.id).subscribe({
      next: () => {
        this.experiences.update((list) => list.filter((x) => x.id !== e.id));
        if (this.selected()?.id === e.id) this.close();
        this.toast.success('Entrée supprimée.');
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }
}
