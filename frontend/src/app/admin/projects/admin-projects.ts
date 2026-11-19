import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectPayload, ProjectsApi } from '../../core/api/projects.api';
import { PROJECT_CATEGORIES, Project, ProjectStatus, categoryLabel } from '../../core/api/models';
import { applyServerErrors, controlError, errorMessage } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { FileDrop } from '../../shared/file-drop';
import { RelativeDatePipe } from '../../shared/format';
import { Icon } from '../../shared/icon';
import { TagInput } from '../../shared/tag-input';
import { PageHeader } from '../layout/page-header';

const URL_PATTERN = /^https?:\/\/.+/i;

@Component({
  selector: 'app-admin-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, PageHeader, Icon, TagInput, FileDrop, RelativeDatePipe],
  template: `
    <app-page-header title="Projets" section="Projets">
      <button type="button" class="btn btn-primary" (click)="startCreate()">
        <app-icon name="plus" [size]="16" /> Nouveau projet
      </button>
    </app-page-header>

    <div class="admin-content split" [class.with-panel]="editing()">
      <section class="card">
        <div class="table-toolbar">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input type="search" placeholder="Rechercher un projet…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </label>
          <label class="inline-field">
            Statut
            <select class="input" [ngModel]="status()" (ngModelChange)="changeStatus($event)">
              <option [ngValue]="null">Tous</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </label>
        </div>

        @if (loading()) {
          <div class="card-pad form-grid">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton" style="height: 48px"></div>
            }
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <app-icon name="folder" [size]="28" />
            <p>{{ projects().length ? 'Aucun projet ne correspond à la recherche.' : 'Aucun projet pour le moment.' }}</p>
            @if (!projects().length) {
              <button type="button" class="btn btn-primary sm" (click)="startCreate()">Créer un projet</button>
            }
          </div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Projet</th>
                  <th class="hide-sm">Technologies</th>
                  <th>Statut</th>
                  <th>En avant</th>
                  <th class="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of filtered(); track p.id) {
                  <tr [class.selected]="selected()?.id === p.id">
                    <td>
                      <div class="project-cell">
                        <span class="thumb">
                          @if (p.cover_url) {
                            <img [src]="p.cover_url" alt="" />
                          }
                        </span>
                        <span>
                          <strong>{{ p.title }}</strong>
                          <small class="muted">{{ label(p.category) }} · modifié {{ (p.updated_at | relativeDate).toLowerCase() }}</small>
                        </span>
                      </div>
                    </td>
                    <td class="hide-sm muted">{{ (p.technologies ?? []).join(', ') || '—' }}</td>
                    <td>
                      <span class="badge" [class.warning]="p.status === 'draft'">
                        {{ p.status === 'published' ? 'Publié' : 'Brouillon' }}
                      </span>
                    </td>
                    <td>
                      <label class="switch" [attr.aria-label]="'Mettre en avant ' + p.title">
                        <input type="checkbox" [checked]="p.is_featured" (change)="toggleFeatured(p, $event)" />
                        <span></span>
                      </label>
                    </td>
                    <td class="right">
                      <div class="row-actions">
                        <button type="button" class="icon-btn" (click)="startEdit(p)" [attr.aria-label]="'Modifier ' + p.title">
                          <app-icon name="pencil" [size]="15" />
                        </button>
                        <button type="button" class="icon-btn danger" (click)="remove(p)" [attr.aria-label]="'Supprimer ' + p.title">
                          <app-icon name="trash" [size]="15" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      @if (editing()) {
        <section class="card card-pad editor">
          <div>
            <h2 class="card-title">{{ selected() ? 'Modifier le projet' : 'Nouveau projet' }}</h2>
            <p class="card-subtitle">Les changements sont visibles sur le site dès l'enregistrement.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="form-grid" novalidate>
            <div class="field">
              <label for="p-title">Titre</label>
              <input id="p-title" class="input" formControlName="title" />
              @if (err('title'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>

            <div class="field">
              <label for="p-summary">Description courte</label>
              <textarea id="p-summary" class="input" rows="3" formControlName="summary" maxlength="300"></textarea>
              <small class="field-hint">{{ form.controls.summary.value.length }}/300 — affichée sur les cartes.</small>
              @if (err('summary'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>

            <div class="field">
              <label for="p-description">Description détaillée</label>
              <textarea id="p-description" class="input" rows="4" formControlName="description" placeholder="Contexte, fonctionnalités, difficultés…"></textarea>
              <small class="field-hint">Affichée sur la page du projet.</small>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="p-category">Catégorie</label>
                <select id="p-category" class="input" formControlName="category">
                  @for (c of categories; track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label for="p-order">Ordre d'affichage</label>
                <input id="p-order" type="number" min="0" class="input" formControlName="sort_order" />
                @if (err('sort_order'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
            </div>

            <div class="field">
              <label for="p-tech">Technologies</label>
              <app-tag-input inputId="p-tech" formControlName="technologies" />
              @if (err('technologies'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>

            <div class="form-row">
              <div class="field">
                <label for="p-demo">Lien démo</label>
                <input id="p-demo" type="url" class="input" formControlName="demo_url" placeholder="https://…" />
                @if (err('demo_url'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
              <div class="field">
                <label for="p-repo">Lien GitHub</label>
                <input id="p-repo" type="url" class="input" formControlName="repo_url" placeholder="https://github.com/…" />
                @if (err('repo_url'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
            </div>

            <div class="field">
              <span class="label">Image de couverture</span>
              @if (selected()?.cover_url; as cover) {
                <div class="cover-preview">
                  <img [src]="cover" alt="Couverture actuelle" />
                  <button type="button" class="btn btn-outline sm" (click)="removeCover()" [disabled]="uploading()">Retirer</button>
                </div>
              }
              <app-file-drop [busy]="uploading()" (fileSelected)="onCover($event)" />
              @if (!selected()) {
                <small class="field-hint">L'image sera envoyée après la création du projet.</small>
              }
              @if (pendingCover(); as f) {
                <small class="field-hint">Image prête : {{ f.name }}</small>
              }
            </div>

            <div class="checks">
              <label class="checkbox"><input type="checkbox" formControlName="published" /> Publié</label>
              <label class="checkbox"><input type="checkbox" formControlName="is_featured" /> Mettre en avant sur l'accueil</label>
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
export class AdminProjects implements OnInit {
  private readonly api = inject(ProjectsApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** ?nouveau=1 depuis le tableau de bord : ouvre directement le formulaire. */
  readonly nouveau = input<string>();

  protected readonly categories = PROJECT_CATEGORIES;
  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(true);
  protected readonly status = signal<ProjectStatus | null>(null);
  protected readonly search = signal('');

  protected readonly editing = signal(false);
  protected readonly selected = signal<Project | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly pendingCover = signal<File | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.projects();
    return this.projects().filter(
      (p) => p.title.toLowerCase().includes(q) || (p.technologies ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  });

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    summary: ['', [Validators.required, Validators.maxLength(300)]],
    description: [''],
    category: ['web' as Project['category'], Validators.required],
    sort_order: [0, [Validators.min(0), Validators.max(32767)]],
    technologies: [[] as string[]],
    demo_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(255)]],
    repo_url: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(255)]],
    published: [false],
    is_featured: [false],
  });

  constructor() {
    this.load();
  }

  ngOnInit(): void {
    if (this.nouveau()) this.startCreate();
  }

  protected label(category: string): string {
    return categoryLabel(category);
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected changeStatus(status: ProjectStatus | null): void {
    this.status.set(status);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list(this.status()).subscribe({
      next: (list) => {
        this.projects.set(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected startCreate(): void {
    this.selected.set(null);
    this.pendingCover.set(null);
    this.formError.set(null);
    const nextOrder = this.projects().reduce((max, p) => Math.max(max, (p.sort_order ?? 0) + 1), 0);
    this.form.reset({ category: 'web', sort_order: nextOrder, technologies: [] });
    this.editing.set(true);
  }

  protected startEdit(p: Project): void {
    this.selected.set(p);
    this.pendingCover.set(null);
    this.formError.set(null);
    this.form.reset({
      title: p.title,
      summary: p.summary,
      description: p.description ?? '',
      category: p.category,
      sort_order: p.sort_order ?? 0,
      technologies: p.technologies ?? [],
      demo_url: p.demo_url ?? '',
      repo_url: p.repo_url ?? '',
      published: p.status === 'published',
      is_featured: p.is_featured,
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
    const payload: ProjectPayload = {
      title: v.title.trim(),
      summary: v.summary.trim(),
      description: v.description.trim() || null,
      category: v.category,
      status: v.published ? 'published' : 'draft',
      is_featured: v.is_featured,
      demo_url: v.demo_url.trim() || null,
      repo_url: v.repo_url.trim() || null,
      sort_order: Number(v.sort_order) || 0,
      technologies: v.technologies,
    };

    const current = this.selected();
    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    this.saving.set(true);
    this.formError.set(null);
    request.subscribe({
      next: (project) => {
        this.upsert(project);
        this.selected.set(project);
        this.saving.set(false);
        this.toast.success(current ? 'Projet enregistré.' : 'Projet créé.');

        const cover = this.pendingCover();
        if (cover) {
          this.pendingCover.set(null);
          this.uploadCover(project, cover);
        }
      },
      error: (err: unknown) => {
        this.saving.set(false);
        const rest = applyServerErrors(this.form, err);
        this.formError.set(Object.values(rest)[0] ?? errorMessage(err));
      },
    });
  }

  protected onCover(file: File): void {
    const project = this.selected();
    if (project) {
      this.uploadCover(project, file);
    } else {
      this.pendingCover.set(file);
    }
  }

  private uploadCover(project: Project, file: File): void {
    this.uploading.set(true);
    this.api.uploadCover(project.id, file).subscribe({
      next: (updated) => {
        this.upsert(updated);
        if (this.selected()?.id === updated.id) this.selected.set(updated);
        this.uploading.set(false);
        this.toast.success('Image de couverture mise à jour.');
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        this.toast.error(errorMessage(err, "L'image n'a pas pu être envoyée."));
      },
    });
  }

  protected removeCover(): void {
    const project = this.selected();
    if (!project) return;
    this.uploading.set(true);
    this.api.deleteCover(project.id).subscribe({
      next: (updated) => {
        this.upsert(updated);
        this.selected.set(updated);
        this.uploading.set(false);
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected toggleFeatured(p: Project, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const is_featured = checkbox.checked;
    this.api.update(p.id, { is_featured }).subscribe({
      next: (updated) => this.upsert(updated),
      error: (err: unknown) => {
        checkbox.checked = !is_featured;
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected remove(p: Project): void {
    if (!confirm(`Supprimer le projet « ${p.title} » ?`)) return;
    this.api.delete(p.id).subscribe({
      next: () => {
        this.projects.update((list) => list.filter((x) => x.id !== p.id));
        if (this.selected()?.id === p.id) this.close();
        this.toast.success('Projet supprimé.');
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  /** Remplace (ou ajoute) un projet dans la liste, triée par ordre d'affichage. */
  private upsert(project: Project): void {
    this.projects.update((list) => {
      const exists = list.some((p) => p.id === project.id);
      const next = exists ? list.map((p) => (p.id === project.id ? project : p)) : [...list, project];
      return next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    });
  }
}
