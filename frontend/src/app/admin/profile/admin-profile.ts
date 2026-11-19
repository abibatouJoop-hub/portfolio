import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ProfileApi } from '../../core/api/profile.api';
import { Profile } from '../../core/api/models';
import { AuthService } from '../../core/auth/auth.service';
import { applyServerErrors, controlError, errorMessage, fieldErrors } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { InitialsPipe } from '../../shared/format';
import { Icon, socialIcon } from '../../shared/icon';
import { PageHeader } from '../layout/page-header';

const URL_PATTERN = /^https?:\/\/.+/i;

type LinkGroup = FormGroup<{ platform: FormControl<string>; url: FormControl<string> }>;

/** Même règle que le backend (Password::defaults) : 12 caractères, majuscule, minuscule, chiffre. */
function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '');
  if (!v) return null;
  const ok = v.length >= 12 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);
  return ok ? null : { server: '12 caractères minimum, avec majuscules, minuscules et chiffres.' };
}

@Component({
  selector: 'app-admin-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeader, Icon, InitialsPipe, DatePipe],
  template: `
    <app-page-header title="Profil" section="Profil">
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving() || !profile()">
        @if (saving()) {
          <span class="spinner"></span>
        }
        Enregistrer les modifications
      </button>
    </app-page-header>

    @if (!profile()) {
      <div class="admin-content two-panels">
        <div class="skeleton" style="height: 420px"></div>
        <div class="skeleton" style="height: 420px"></div>
      </div>
    } @else {
      <div class="admin-content two-panels">
        <section class="card card-pad form-grid" [formGroup]="form">
          <h2 class="card-title">Informations personnelles</h2>

          <div class="photo-row">
            <span class="avatar xl">
              @if (profile()!.photo_url) {
                <img [src]="profile()!.photo_url" alt="Photo de profil" />
              } @else {
                {{ profile()!.full_name | initials }}
              }
            </span>
            <div>
              <div class="row-actions">
                <label class="btn btn-outline sm" [class.disabled]="uploading()">
                  <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" (change)="upload('photo', $event)" [disabled]="uploading()" />
                  {{ uploading() === 'photo' ? 'Envoi…' : 'Changer la photo' }}
                </label>
                @if (profile()!.photo_url) {
                  <button type="button" class="btn btn-ghost sm text-danger" (click)="removeFile('photo')">Retirer</button>
                }
              </div>
              <small class="field-hint">JPG, PNG ou WebP (2 Mo max.), format carré conseillé.</small>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="pf-first">Prénom</label>
              <input id="pf-first" class="input" formControlName="first_name" />
              @if (err('first_name'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
            <div class="field">
              <label for="pf-last">Nom</label>
              <input id="pf-last" class="input" formControlName="last_name" />
              @if (err('last_name'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
          </div>

          <div class="field">
            <label for="pf-title">Titre professionnel</label>
            <input id="pf-title" class="input" formControlName="title" placeholder="Développeuse web full-stack" />
            @if (err('title'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>

          <div class="form-row">
            <div class="field">
              <label for="pf-email">E-mail de contact</label>
              <input id="pf-email" type="email" class="input" formControlName="contact_email" placeholder="votre.email@exemple.com" />
              @if (err('contact_email'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
            <div class="field">
              <label for="pf-phone">Téléphone</label>
              <input id="pf-phone" type="tel" class="input" formControlName="phone" placeholder="+221 00 000 00 00" />
              @if (err('phone'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
          </div>

          <label class="toggle-row">
            <span>
              <strong>Disponible pour de nouvelles opportunités</strong>
              <small class="muted">Affiche le badge en haut de l'accueil.</small>
            </span>
            <input type="checkbox" formControlName="is_available" />
          </label>
        </section>

        <div class="stack">
          <section class="card card-pad form-grid" [formGroup]="form">
            <h2 class="card-title">Réseaux &amp; liens</h2>
            <div formArrayName="social_links" class="form-grid">
              @for (link of socialLinks.controls; track link; let i = $index) {
                <div class="social-row" [formGroupName]="i">
                  <span class="social-icon"><app-icon [name]="icon(link.value.platform)" [size]="16" /></span>
                  <input class="input platform" formControlName="platform" placeholder="github" aria-label="Plateforme" />
                  <input class="input" type="url" formControlName="url" placeholder="https://…" aria-label="Adresse" />
                  <button type="button" class="icon-btn ghost danger" (click)="socialLinks.removeAt(i)" aria-label="Retirer ce lien">
                    <app-icon name="trash" [size]="15" />
                  </button>
                </div>
                @if (linkError(i); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              }
            </div>
            @if (socialLinks.length < 10) {
              <button type="button" class="btn btn-outline sm" (click)="addLink()"><app-icon name="plus" [size]="14" /> Ajouter un lien</button>
            }
            <small class="field-hint">Plateformes reconnues pour l'icône : github, linkedin, email. Les liens s'affichent dans cet ordre.</small>
          </section>

          <section class="card card-pad form-grid">
            <h2 class="card-title">CV</h2>
            <div class="cv-row">
              <span class="file-badge">PDF</span>
              <div class="list-main">
                @if (profile()!.cv_url) {
                  <a [href]="profile()!.cv_url" target="_blank" rel="noopener"><strong>CV_{{ profile()!.first_name }}_{{ profile()!.last_name }}.pdf</strong></a>
                  @if (profile()!.updated_at) {
                    <small class="muted">Profil mis à jour le {{ profile()!.updated_at | date: 'longDate' }}</small>
                  }
                } @else {
                  <strong>Aucun CV</strong>
                  <small class="muted">PDF, 5 Mo maximum.</small>
                }
              </div>
              <label class="btn btn-outline sm" [class.disabled]="uploading()">
                <input type="file" class="sr-only" accept="application/pdf" (change)="upload('cv', $event)" [disabled]="uploading()" />
                {{ uploading() === 'cv' ? 'Envoi…' : profile()!.cv_url ? 'Remplacer' : 'Envoyer' }}
              </label>
              @if (profile()!.cv_url) {
                <button type="button" class="icon-btn ghost danger" (click)="removeFile('cv')" aria-label="Retirer le CV">
                  <app-icon name="trash" [size]="15" />
                </button>
              }
            </div>
            <small class="field-hint">Lié au bouton « Télécharger mon CV » de l'accueil.</small>
          </section>

          <form class="card card-pad form-grid" [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
            <h2 class="card-title">Sécurité</h2>
            <input type="email" class="sr-only" autocomplete="username" [value]="auth.user()?.email ?? ''" readonly tabindex="-1" aria-hidden="true" />
            <div class="field">
              <label for="pw-current">Mot de passe actuel</label>
              <input id="pw-current" type="password" class="input" formControlName="current_password" autocomplete="current-password" />
              @if (pwErr('current_password'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>
            <div class="form-row">
              <div class="field">
                <label for="pw-new">Nouveau mot de passe</label>
                <input id="pw-new" type="password" class="input" formControlName="password" autocomplete="new-password" />
                @if (pwErr('password'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
              <div class="field">
                <label for="pw-confirm">Confirmation</label>
                <input id="pw-confirm" type="password" class="input" formControlName="password_confirmation" autocomplete="new-password" />
                @if (pwErr('password_confirmation'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
            </div>
            <div>
              <button type="submit" class="btn btn-outline" [disabled]="changingPassword()">Mettre à jour le mot de passe</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminProfile {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly profile = signal<Profile | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploading = signal<'photo' | 'cv' | null>(null);
  protected readonly changingPassword = signal(false);

  protected readonly form = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(80)]],
    last_name: ['', [Validators.required, Validators.maxLength(80)]],
    title: ['', [Validators.required, Validators.maxLength(150)]],
    contact_email: ['', [Validators.email, Validators.maxLength(255)]],
    phone: ['', Validators.maxLength(30)],
    is_available: [true],
    social_links: this.fb.array<LinkGroup>([]),
  });

  protected readonly passwordForm = this.fb.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, strongPassword]],
    password_confirmation: ['', Validators.required],
  });

  protected get socialLinks() {
    return this.form.controls.social_links;
  }

  constructor() {
    this.api.get().subscribe({
      next: (p) => this.fill(p),
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected icon(platform: string | undefined): string {
    return socialIcon(platform ?? '');
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected pwErr(name: string): string | null {
    return controlError(this.passwordForm.get(name));
  }

  protected linkError(i: number): string | null {
    const group = this.socialLinks.at(i);
    return controlError(group.get('platform')) ?? controlError(group.get('url'));
  }

  private linkGroup(platform = '', url = ''): LinkGroup {
    return this.fb.group({
      platform: [platform, [Validators.required, Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9_-]+$/)]],
      url: [url, [Validators.required, Validators.pattern(URL_PATTERN), Validators.maxLength(255)]],
    });
  }

  protected addLink(): void {
    this.socialLinks.push(this.linkGroup());
  }

  private fill(p: Profile): void {
    this.form.patchValue({
      first_name: p.first_name,
      last_name: p.last_name,
      title: p.title,
      contact_email: p.contact_email ?? '',
      phone: p.phone ?? '',
      is_available: p.is_available,
    });
    this.socialLinks.clear();
    for (const link of p.social_links ?? []) {
      this.socialLinks.push(this.linkGroup(link.platform, link.url));
    }
    this.form.markAsPristine();
    this.profile.set(p);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Certains champs sont invalides.');
      return;
    }
    const v = this.form.getRawValue();

    this.saving.set(true);
    this.api
      .update({
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        title: v.title.trim(),
        contact_email: v.contact_email.trim() || null,
        phone: v.phone.trim() || null,
        is_available: v.is_available,
        social_links: v.social_links.map((l) => ({ platform: l.platform.trim().toLowerCase(), url: l.url.trim() })),
      })
      .subscribe({
        next: (p) => {
          this.saving.set(false);
          this.fill(p);
          this.toast.success('Profil enregistré.');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          const rest = applyServerErrors(this.form, err);
          this.toast.error(Object.values(rest)[0] ?? errorMessage(err));
        },
      });
  }

  protected upload(kind: 'photo' | 'cv', event: Event): void {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    field.value = '';
    if (!file) return;

    const maxMb = kind === 'cv' ? 5 : 2;
    if (file.size > maxMb * 1024 * 1024) {
      this.toast.error(`Fichier trop lourd (${maxMb} Mo maximum).`);
      return;
    }

    this.uploading.set(kind);
    this.api.uploadFile(kind, file).subscribe({
      next: (p) => {
        this.uploading.set(null);
        this.profile.set(p);
        this.toast.success(kind === 'cv' ? 'CV mis à jour.' : 'Photo mise à jour.');
      },
      error: (err: unknown) => {
        this.uploading.set(null);
        this.toast.error(fieldErrors(err)['file'] ?? errorMessage(err, "Le fichier n'a pas pu être envoyé."));
      },
    });
  }

  protected removeFile(kind: 'photo' | 'cv'): void {
    if (!confirm(kind === 'cv' ? 'Retirer le CV du site ?' : 'Retirer la photo de profil ?')) return;
    this.api.deleteFile(kind).subscribe({
      next: (p) => this.profile.set(p),
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected changePassword(): void {
    const v = this.passwordForm.getRawValue();
    if (v.password && v.password !== v.password_confirmation) {
      this.passwordForm.controls.password_confirmation.setErrors({ server: 'Les mots de passe ne correspondent pas.' });
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword.set(true);
    this.auth.updatePassword(v).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('Mot de passe mis à jour.');
      },
      error: (err: unknown) => {
        this.changingPassword.set(false);
        const rest = applyServerErrors(this.passwordForm, err);
        if (Object.keys(rest).length || !Object.keys(fieldErrors(err)).length) {
          this.toast.error(Object.values(rest)[0] ?? errorMessage(err));
        }
      },
    });
  }
}
