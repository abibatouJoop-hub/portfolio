import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkillsApi } from '../../core/api/skills.api';
import { SkillCategory } from '../../core/api/models';
import { errorMessage, fieldErrors } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { Icon } from '../../shared/icon';

interface Row {
  id: number;
  name: string;
  sort_order: number;
  count: number;
}

/** Création, renommage, ordre et suppression des catégories de compétences. */
@Component({
  selector: 'app-skill-categories-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <div class="card card-pad modal form-grid" role="dialog" aria-modal="true" aria-labelledby="cat-title" (click)="$event.stopPropagation()">
        <div class="card-head">
          <h2 id="cat-title" class="card-title">Catégories de compétences</h2>
          <button type="button" class="icon-btn ghost" (click)="closed.emit()" aria-label="Fermer"><app-icon name="x" /></button>
        </div>

        <ul class="category-rows">
          @for (row of rows(); track row.id) {
            <li>
              <input class="input" [(ngModel)]="row.name" maxlength="80" aria-label="Nom de la catégorie" />
              <input class="input order" type="number" min="0" [(ngModel)]="row.sort_order" aria-label="Ordre" title="Ordre d'affichage" />
              <button type="button" class="icon-btn" (click)="save(row)" aria-label="Enregistrer"><app-icon name="check" [size]="15" /></button>
              <button type="button" class="icon-btn danger" (click)="remove(row)" aria-label="Supprimer"><app-icon name="trash" [size]="15" /></button>
            </li>
          } @empty {
            <li class="muted">Aucune catégorie.</li>
          }
        </ul>

        <form class="category-add" (ngSubmit)="create()">
          <input class="input" name="newName" [(ngModel)]="newName" placeholder="Nouvelle catégorie (ex. DevOps)" maxlength="80" />
          <button type="submit" class="btn btn-primary" [disabled]="!newName.trim()"><app-icon name="plus" [size]="16" /> Ajouter</button>
        </form>

        @if (error()) {
          <p class="alert">{{ error() }}</p>
        }
        <p class="field-hint">Supprimer une catégorie supprime aussi ses compétences.</p>
      </div>
    </div>
  `,
})
export class SkillCategoriesModal {
  private readonly api = inject(SkillsApi);
  private readonly toast = inject(ToastService);

  readonly categories = input.required<SkillCategory[]>();
  readonly changed = output<void>();
  readonly closed = output<void>();

  protected readonly rows = signal<Row[]>([]);
  protected readonly error = signal<string | null>(null);
  protected newName = '';

  constructor() {
    effect(() => {
      this.rows.set(
        this.categories().map((c, i) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order ?? i,
          count: c.skills?.length ?? 0,
        })),
      );
    });
  }

  protected create(): void {
    const name = this.newName.trim();
    if (!name) return;
    const sort_order = this.rows().reduce((max, r) => Math.max(max, r.sort_order + 1), 0);
    this.api.createCategory({ name, sort_order }).subscribe({
      next: () => {
        this.newName = '';
        this.error.set(null);
        this.toast.success(`Catégorie « ${name} » créée.`);
        this.changed.emit();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected save(row: Row): void {
    if (!row.name.trim()) {
      this.error.set('Le nom est obligatoire.');
      return;
    }
    this.api.updateCategory(row.id, { name: row.name.trim(), sort_order: Number(row.sort_order) || 0 }).subscribe({
      next: () => {
        this.error.set(null);
        this.toast.success('Catégorie enregistrée.');
        this.changed.emit();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  protected remove(row: Row): void {
    const warning = row.count ? ` et ses ${row.count} compétence(s)` : '';
    if (!confirm(`Supprimer la catégorie « ${row.name} »${warning} ?`)) return;
    this.api.deleteCategory(row.id).subscribe({
      next: () => {
        this.toast.success('Catégorie supprimée.');
        this.changed.emit();
      },
      error: (err: unknown) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.error.set(Object.values(fieldErrors(err))[0] ?? errorMessage(err));
  }
}
