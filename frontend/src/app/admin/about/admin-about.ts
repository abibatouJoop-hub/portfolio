import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileApi } from '../../core/api/profile.api';
import { Profile } from '../../core/api/models';
import { applyServerErrors, controlError, errorMessage } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { Icon } from '../../shared/icon';
import { RichTextPipe } from '../../shared/rich-text';
import { PageHeader } from '../layout/page-header';

@Component({
  selector: 'app-admin-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeader, Icon, RichTextPipe],
  template: `
    <app-page-header title="Accueil & À propos" section="À propos">
      <a href="/" target="_blank" rel="noopener" class="btn btn-outline">Aperçu</a>
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving() || !profile()">
        @if (saving()) {
          <span class="spinner"></span>
        }
        Enregistrer
      </button>
    </app-page-header>

    <div class="admin-content split with-panel" [formGroup]="form">
      <div class="stack">
        <section class="card card-pad form-grid">
          <div>
            <h2 class="card-title">Section d'accueil</h2>
            <p class="card-subtitle">Le premier écran que voient les visiteurs.</p>
          </div>
          <div class="field">
            <label for="a-hero-title">Phrase d'accroche</label>
            <input id="a-hero-title" class="input" formControlName="hero_title" placeholder="Bonjour, je suis …" />
            @if (err('hero_title'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>
          <div class="field">
            <label for="a-hero-sub">Sous-titre</label>
            <textarea id="a-hero-sub" class="input" rows="2" formControlName="hero_subtitle"></textarea>
            @if (err('hero_subtitle'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>
          <div class="field">
            <label for="a-stack">Stack principale (badge sur la photo)</label>
            <input id="a-stack" class="input" formControlName="main_stack" placeholder="Laravel · Angular · PostgreSQL" />
          </div>
        </section>

        <section class="card card-pad form-grid">
          <div>
            <h2 class="card-title">Section « À propos »</h2>
            <p class="card-subtitle">Votre présentation et les informations clés.</p>
          </div>
          <div class="field">
            <label for="a-title">Titre</label>
            <input id="a-title" class="input" formControlName="about_title" />
          </div>
          <div class="field">
            <label for="a-text">Texte de présentation</label>
            <div class="editor-box">
              <div class="editor-toolbar" role="toolbar" aria-label="Mise en forme">
                <button type="button" (click)="wrap(textarea, '**', '**')" title="Gras (**texte**)"><strong>B</strong></button>
                <button type="button" (click)="wrap(textarea, '*', '*')" title="Italique (*texte*)"><em>I</em></button>
                <button type="button" (click)="insertLink(textarea)" title="Lien [texte](https://…)"><app-icon name="link" [size]="14" /></button>
              </div>
              <textarea #textarea id="a-text" class="input" rows="7" formControlName="about_text"></textarea>
            </div>
            <small class="field-hint">Une ligne vide sépare deux paragraphes.</small>
            @if (err('about_text'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>
          <div class="form-row three">
            <div class="field">
              <label for="a-loc">Localisation</label>
              <input id="a-loc" class="input" formControlName="location" placeholder="Ville, Pays" />
            </div>
            <div class="field">
              <label for="a-edu">Formation</label>
              <input id="a-edu" class="input" formControlName="education" placeholder="Diplôme, École" />
            </div>
            <div class="field">
              <label for="a-lang">Langues</label>
              <input id="a-lang" class="input" formControlName="languages" placeholder="Français, Anglais" />
            </div>
          </div>
        </section>
      </div>

      <aside class="card card-pad editor">
        <div class="card-head">
          <h2 class="card-title">Aperçu</h2>
          <small class="muted">Mis à jour en direct</small>
        </div>
        <div class="preview">
          @if (profile()?.is_available) {
            <span class="badge"><span class="dot"></span>Disponible</span>
          }
          <h3>
            {{ values().hero_title || 'Bonjour, je suis ' + (profile()?.first_name ?? '') + '.' }}
            <span class="accent">{{ profile()?.title }}</span>
          </h3>
          <p class="muted">{{ values().hero_subtitle }}</p>
          <div class="row-actions">
            <span class="btn btn-primary sm">Voir mes projets</span>
            <span class="btn btn-outline sm">Mon CV</span>
          </div>
        </div>
        <div class="preview">
          <span class="eyebrow">À propos</span>
          <h3>{{ values().about_title }}</h3>
          <div class="rich-text muted" [innerHTML]="values().about_text | richText"></div>
        </div>
        <small class="muted">Le titre professionnel et le badge de disponibilité se modifient dans « Profil ».</small>
      </aside>
    </div>
  `,
})
export class AdminAbout {
  private readonly api = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly profile = signal<Profile | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    hero_title: ['', Validators.maxLength(200)],
    hero_subtitle: ['', Validators.maxLength(1000)],
    main_stack: ['', Validators.maxLength(150)],
    about_title: ['', Validators.maxLength(200)],
    about_text: ['', Validators.maxLength(10000)],
    location: ['', Validators.maxLength(150)],
    education: ['', Validators.maxLength(150)],
    languages: [''],
  });

  /** Valeurs du formulaire en signal, pour l'aperçu en direct. */
  protected readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  constructor() {
    this.api.get().subscribe({
      next: (p) => this.fill(p),
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  private fill(p: Profile): void {
    this.form.setValue({
      hero_title: p.hero_title ?? '',
      hero_subtitle: p.hero_subtitle ?? '',
      main_stack: p.main_stack ?? '',
      about_title: p.about_title ?? '',
      about_text: p.about_text ?? '',
      location: p.location ?? '',
      education: p.education ?? '',
      languages: (p.languages ?? []).join(', '),
    });
    this.profile.set(p);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const orNull = (s: string) => s.trim() || null;

    this.saving.set(true);
    this.api
      .update({
        hero_title: orNull(v.hero_title),
        hero_subtitle: orNull(v.hero_subtitle),
        main_stack: orNull(v.main_stack),
        about_title: orNull(v.about_title),
        about_text: orNull(v.about_text),
        location: orNull(v.location),
        education: orNull(v.education),
        languages: v.languages
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean)
          .slice(0, 10),
      })
      .subscribe({
        next: (p) => {
          this.saving.set(false);
          this.fill(p);
          this.toast.success('Accueil et « À propos » enregistrés.');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          const rest = applyServerErrors(this.form, err);
          this.toast.error(Object.values(rest)[0] ?? errorMessage(err));
        },
      });
  }

  // ------------------------------------------------------------ Barre de mise en forme

  protected wrap(textarea: HTMLTextAreaElement, before: string, after: string, placeholder = 'texte'): void {
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    this.form.controls.about_text.setValue(next);
    this.form.controls.about_text.markAsDirty();
    queueMicrotask(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  protected insertLink(textarea: HTMLTextAreaElement): void {
    const url = prompt('Adresse du lien (https://…)', 'https://');
    if (!url || !/^https?:\/\/.+/i.test(url)) return;
    this.wrap(textarea, '[', `](${url})`, 'lien');
  }
}
