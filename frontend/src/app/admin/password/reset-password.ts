import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { strongPassword } from '../../core/auth/password.validators';
import { applyServerErrors, controlError, errorMessage, fieldErrors } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { Icon } from '../../shared/icon';
import { AuthAside } from '../login/auth-aside';

/**
 * Page ouverte depuis le lien de l'e-mail : /admin/reset-password?token=…&email=…
 * (chemin fixé côté backend par portfolio.password_reset_path).
 */
@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, AuthAside],
  template: `
    <div class="login-page">
      <app-auth-aside />

      <main class="login-main">
        @if (invalidLink()) {
          <div class="card login-card form-grid" role="alert">
            <span class="login-icon"><app-icon name="info" [size]="20" /></span>
            <div>
              <h2>Lien invalide</h2>
              <p class="muted">{{ invalidLink() }}</p>
            </div>
            <a routerLink="/admin/mot-de-passe-oublie" [queryParams]="{ email: email || null }" class="btn btn-primary lg block">
              Demander un nouveau lien
            </a>
            <a routerLink="/admin/connexion" class="login-back"><app-icon name="arrow-left" [size]="14" /> Retour à la connexion</a>
          </div>
        } @else {
          <form class="card login-card form-grid" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <span class="login-icon"><app-icon name="lock" [size]="20" /></span>
            <div>
              <h2>Nouveau mot de passe</h2>
              <p class="muted">Choisissez un nouveau mot de passe pour <strong>{{ email }}</strong>.</p>
            </div>

            <!-- Aide les gestionnaires de mots de passe à associer le compte. -->
            <input type="email" [value]="email" autocomplete="username" hidden readonly />

            <div class="field">
              <label for="password">Nouveau mot de passe</label>
              <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" />
              @if (err('password'); as e) {
                <small class="field-error">{{ e }}</small>
              } @else {
                <small class="field-hint">12 caractères minimum, avec majuscules, minuscules et chiffres.</small>
              }
            </div>

            <div class="field">
              <label for="password_confirmation">Confirmer le mot de passe</label>
              <input id="password_confirmation" type="password" class="input" formControlName="password_confirmation" autocomplete="new-password" />
              @if (err('password_confirmation'); as e) {
                <small class="field-error">{{ e }}</small>
              }
            </div>

            @if (error()) {
              <p class="alert" role="alert">{{ error() }}</p>
            }

            <button type="submit" class="btn btn-primary lg block" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
              }
              Enregistrer le mot de passe
            </button>

            <a routerLink="/admin/connexion" class="login-back"><app-icon name="arrow-left" [size]="14" /> Retour à la connexion</a>
          </form>
        }
      </main>
    </div>
  `,
})
export class ResetPassword implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** Paramètres du lien reçu par e-mail. */
  readonly tokenParam = input<string>(undefined, { alias: 'token' });
  readonly emailParam = input<string>(undefined, { alias: 'email' });

  /** Gardés en mémoire : on les retire de l'adresse dès l'arrivée sur la page. */
  private token = '';
  protected email = '';

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Message affiché à la place du formulaire si le lien est inutilisable. */
  protected readonly invalidLink = signal<string | null>(null);

  protected readonly form = this.fb.group({
    password: ['', [Validators.required, strongPassword]],
    password_confirmation: ['', Validators.required],
  });

  ngOnInit(): void {
    this.token = this.tokenParam() ?? '';
    this.email = this.emailParam() ?? '';

    if (!this.token || !this.email) {
      this.invalidLink.set('Ce lien est incomplet. Copiez-le entièrement depuis l’e-mail ou demandez-en un nouveau.');
      return;
    }

    // Le jeton ne reste ni dans l'historique du navigateur ni dans l'en-tête Referer.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected submit(): void {
    const v = this.form.getRawValue();
    if (v.password && v.password_confirmation && v.password !== v.password_confirmation) {
      this.form.controls.password_confirmation.setErrors({ server: 'Les mots de passe ne correspondent pas.' });
      this.form.controls.password_confirmation.markAsTouched();
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.resetPassword({ token: this.token, email: this.email, ...v }).subscribe({
      next: (message) => {
        this.toast.success(message);
        void this.router.navigate(['/admin/connexion'], { queryParams: { email: this.email } });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const errors = fieldErrors(err);

        // Jeton invalide, expiré ou déjà utilisé : le backend le signale sur « email ».
        if (errors['email'] || errors['token']) {
          this.invalidLink.set(errors['email'] ?? errors['token']);
          return;
        }

        const rest = applyServerErrors(this.form, err);
        if (!Object.keys(errors).length || Object.keys(rest).length) {
          this.error.set(Object.values(rest)[0] ?? errorMessage(err));
        }
      },
    });
  }
}
