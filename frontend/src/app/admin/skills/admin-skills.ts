import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkillsApi } from '../../core/api/skills.api';
import { Skill, SkillCategory, skillLevelLabel } from '../../core/api/models';
import { applyServerErrors, controlError, errorMessage, fieldErrors } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../layout/page-header';
import { SkillCategoriesModal } from './skill-categories-modal';

interface Draft {
  id: number;
  name: string;
  level: number;
  is_visible: boolean;
}

@Component({
  selector: 'app-admin-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, PageHeader, Icon, SkillCategoriesModal],
  template: `
    <app-page-header title="Compétences" section="Compétences">
      <button type="button" class="btn btn-outline" (click)="manageCategories.set(true)">Gérer les catégories</button>
    </app-page-header>

    <div class="admin-content">
      <section class="card card-pad">
        <h2 class="card-title">Ajouter une compétence</h2>
        @if (categories().length === 0 && !loading()) {
          <p class="muted add-skill-empty">
            Créez d'abord une catégorie (Backend, Frontend…).
            <button type="button" class="btn btn-primary sm" (click)="manageCategories.set(true)">Créer une catégorie</button>
          </p>
        } @else {
          <form class="add-skill" [formGroup]="form" (ngSubmit)="add()" novalidate>
            <div class="field">
              <label for="s-name">Nom</label>
              <input id="s-name" class="input" formControlName="name" placeholder="Ex. Docker" />
              @if (err('name'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
            <div class="field">
              <label for="s-cat">Catégorie</label>
              <select id="s-cat" class="input" formControlName="skill_category_id">
                @for (c of categories(); track c.id) {
                  <option [ngValue]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label for="s-level" class="level-label">
                Niveau <strong>{{ form.controls.level.value }} % · {{ levelLabel(form.controls.level.value) }}</strong>
              </label>
              <input id="s-level" type="range" min="0" max="100" step="5" class="range" formControlName="level" />
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="adding()">
              <app-icon name="plus" [size]="16" /> Ajouter
            </button>
          </form>
        }
      </section>

      @if (loading()) {
        <div class="skills-grid">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton" style="height: 260px"></div>
          }
        </div>
      } @else {
        <div class="skills-grid">
          @for (c of categories(); track c.id) {
            <section class="card skill-admin-card">
              <header>
                <h3 class="card-title">{{ c.name }}</h3>
                <small class="muted">{{ c.skills?.length ?? 0 }} compétence{{ (c.skills?.length ?? 0) > 1 ? 's' : '' }}</small>
              </header>
              <ul>
                @for (s of c.skills ?? []; track s.id; let i = $index) {
                  <li
                    [class.dragging]="drag()?.id === s.id"
                    [class.drop-target]="dropTarget() === s.id"
                    (dragover)="onDragOver($event, c, s)"
                    (dragleave)="dropTarget.set(null)"
                    (drop)="onDrop($event, c, i)"
                  >
                    @if (editingId() === s.id) {
                      <div class="skill-edit">
                        <input class="input" [(ngModel)]="draftModel.name" aria-label="Nom" maxlength="80" />
                        <label class="level-label">
                          <span>{{ draftModel.level }} %</span>
                          <input type="range" min="0" max="100" step="5" class="range" [(ngModel)]="draftModel.level" aria-label="Niveau" />
                        </label>
                        <label class="checkbox"><input type="checkbox" [(ngModel)]="draftModel.is_visible" /> Visible sur le site</label>
                        @if (draftError()) {
                          <small class="field-error">{{ draftError() }}</small>
                        }
                        <div class="row-actions">
                          <button type="button" class="btn btn-outline sm" (click)="editingId.set(null)">Annuler</button>
                          <button type="button" class="btn btn-primary sm" (click)="saveDraft(s)">Enregistrer</button>
                        </div>
                      </div>
                    } @else {
                      <span
                        class="grip"
                        draggable="true"
                        (dragstart)="onDragStart($event, c, s)"
                        (dragend)="drag.set(null); dropTarget.set(null)"
                        title="Glisser pour réordonner"
                        aria-hidden="true"
                      >
                        <app-icon name="grip" [size]="14" />
                      </span>
                      <div class="skill-main" [class.hidden-skill]="s.is_visible === false">
                        <div class="skill-line">
                          <strong>{{ s.name }}</strong>
                          <small>
                            @if (s.is_visible === false) {
                              <span class="badge muted">Masquée</span>
                            }
                            {{ s.level }}%
                          </small>
                        </div>
                        <div class="progress"><span [style.width.%]="s.level"></span></div>
                      </div>
                      <button type="button" class="icon-btn ghost" (click)="edit(s)" [attr.aria-label]="'Modifier ' + s.name">
                        <app-icon name="pencil" [size]="15" />
                      </button>
                      <button type="button" class="icon-btn ghost danger" (click)="remove(c, s)" [attr.aria-label]="'Supprimer ' + s.name">
                        <app-icon name="trash" [size]="15" />
                      </button>
                    }
                  </li>
                } @empty {
                  <li class="muted empty-row">Aucune compétence dans cette catégorie.</li>
                }
              </ul>
            </section>
          }
        </div>
        @if (categories().length) {
          <p class="muted hint">Glissez-déposez les compétences pour changer leur ordre d'affichage sur le site.</p>
        }
      }
    </div>

    @if (manageCategories()) {
      <app-skill-categories-modal [categories]="categories()" (changed)="load()" (closed)="manageCategories.set(false)" />
    }
  `,
})
export class AdminSkills {
  private readonly api = inject(SkillsApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly categories = signal<SkillCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly adding = signal(false);
  protected readonly manageCategories = signal(false);

  /** Compétence en cours d'édition (édition en ligne) et ses valeurs saisies. */
  protected readonly editingId = signal<number | null>(null);
  protected draftModel: Draft = { id: 0, name: "", level: 0, is_visible: true };
  protected readonly draftError = signal<string | null>(null);

  protected readonly drag = signal<{ categoryId: number; id: number } | null>(null);
  protected readonly dropTarget = signal<number | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    skill_category_id: [0, Validators.required],
    level: [60],
  });

  constructor() {
    this.load();
  }

  protected levelLabel(level: number): string {
    return skillLevelLabel(Number(level));
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected load(): void {
    this.api.listCategories().subscribe({
      next: (categories) => {
        const sorted = categories.map((c) => ({
          ...c,
          skills: [...(c.skills ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id),
        }));
        this.categories.set(sorted);
        const current = this.form.controls.skill_category_id.value;
        if (!sorted.some((c) => c.id === current)) {
          this.form.controls.skill_category_id.setValue(sorted[0]?.id ?? 0);
        }
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const category = this.categories().find((c) => c.id === Number(v.skill_category_id));
    this.adding.set(true);

    this.api
      .create({
        name: v.name.trim(),
        skill_category_id: Number(v.skill_category_id),
        level: Number(v.level),
        sort_order: category?.skills?.length ?? 0,
      })
      .subscribe({
        next: (skill) => {
          this.adding.set(false);
          this.patchCategory(skill.skill_category_id!, (skills) => [...skills, skill]);
          this.form.reset({ name: '', skill_category_id: v.skill_category_id, level: 60 });
          this.toast.success(`« ${skill.name} » ajoutée.`);
        },
        error: (err: unknown) => {
          this.adding.set(false);
          const rest = applyServerErrors(this.form, err);
          if (Object.keys(rest).length || !Object.keys(fieldErrors(err)).length) {
            this.toast.error(Object.values(rest)[0] ?? errorMessage(err));
          }
        },
      });
  }

  protected edit(s: Skill): void {
    this.draftError.set(null);
    this.draftModel = { id: s.id, name: s.name, level: s.level, is_visible: s.is_visible ?? true };
    this.editingId.set(s.id);
  }

  protected saveDraft(s: Skill): void {
    const d = this.draftModel;
    if (!d.name.trim()) {
      this.draftError.set('Le nom est obligatoire.');
      return;
    }
    this.api.update(s.id, { name: d.name.trim(), level: Number(d.level), is_visible: d.is_visible }).subscribe({
      next: (updated) => {
        this.patchCategory(updated.skill_category_id!, (skills) => skills.map((x) => (x.id === updated.id ? updated : x)));
        this.editingId.set(null);
        this.toast.success('Compétence enregistrée.');
      },
      error: (err: unknown) => this.draftError.set(Object.values(fieldErrors(err))[0] ?? errorMessage(err)),
    });
  }

  protected remove(c: SkillCategory, s: Skill): void {
    if (!confirm(`Supprimer la compétence « ${s.name} » ?`)) return;
    this.api.delete(s.id).subscribe({
      next: () => {
        this.patchCategory(c.id, (skills) => skills.filter((x) => x.id !== s.id));
        this.toast.success('Compétence supprimée.');
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  // ------------------------------------------------------------ Glisser-déposer (dans une catégorie)

  protected onDragStart(event: DragEvent, c: SkillCategory, s: Skill): void {
    this.drag.set({ categoryId: c.id, id: s.id });
    event.dataTransfer?.setData('text/plain', String(s.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected onDragOver(event: DragEvent, c: SkillCategory, s: Skill): void {
    const drag = this.drag();
    if (drag && drag.categoryId === c.id) {
      event.preventDefault(); // autorise le dépôt
      this.dropTarget.set(s.id === drag.id ? null : s.id);
    }
  }

  protected onDrop(event: DragEvent, c: SkillCategory, targetIndex: number): void {
    event.preventDefault();
    const drag = this.drag();
    this.drag.set(null);
    this.dropTarget.set(null);
    if (!drag || drag.categoryId !== c.id) return;

    const skills = [...(c.skills ?? [])];
    const from = skills.findIndex((s) => s.id === drag.id);
    if (from === -1 || from === targetIndex) return;

    const previous = c.skills ?? [];
    const [moved] = skills.splice(from, 1);
    skills.splice(targetIndex, 0, moved);
    this.patchCategory(c.id, () => skills);

    this.api.reorder(skills.map((s) => s.id)).subscribe({
      error: (err: unknown) => {
        this.patchCategory(c.id, () => previous); // annule l'affichage
        this.toast.error(errorMessage(err, "Le nouvel ordre n'a pas pu être enregistré."));
      },
    });
  }

  private patchCategory(categoryId: number, fn: (skills: Skill[]) => Skill[]): void {
    this.categories.update((list) =>
      list.map((c) => (c.id === categoryId ? { ...c, skills: fn(c.skills ?? []) } : c)),
    );
  }
}
