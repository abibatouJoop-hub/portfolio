import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { applyServerErrors, controlError, errorMessage } from '../../core/http/errors';
import { Icon } from '../../shared/icon';
import { AuthAside } from '../login/auth-aside';

/** « Mot de passe oublié ? » : demande d'un lien de réinitialisation par e-mail. */
@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, AuthAside],
  template: `
    <div class="login-page">
      <app-auth-aside />

      <main class="login-main">
        @if (sent(); as message) {
          <div class="card login-card form-grid" role="status">
            <span class="login-icon"><app-icon name="mail" [size]="20" /></span>
            <div>
              <h2>Vérifiez votre boîte mail</h2>
              <p class="muted">{{ message }}</p>
            </div>
            <p class="field-hint">
              Le lien expire au bout de 60 minutes. Pensez à regarder dans les courriers indésirables.
            </p>
            <button type="button" class="btn btn-ghost block" (click)="sent.set(null)">Renvoyer un lien</button>
            <a routerLink="/admin/connexion" class="login-back"><app-icon name="arrow-left" [size]="14" /> Retour à la connexion</a>
          </div>
        } @else {
          <form class="card login-card form-grid" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <span class="login-icon"><app-icon name="lock" [size]="20" /></span>
            <div>
              <h2>Mot de passe oublié</h2>
              <p class="muted">Saisissez votre adresse e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
            </div>

            <div class="field">
              <label for="email">Adresse e-mail</label>
              <input id="email" type="email" class="input" formControlName="email" placeholder="vous@exemple.com" autocomplete="username" />
              @if (err('email'); as e) {
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
              Envoyer le lien
            </button>

            <a routerLink="/admin/connexion" class="login-back"><app-icon name="arrow-left" [size]="14" /> Retour à la connexion</a>
          </form>
        }
      </main>
    </div>
  `,
})
export class ForgotPassword implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** ?email=… : adresse déjà saisie sur la page de connexion. */
  readonly email = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Message de confirmation du serveur une fois le lien demandé. */
  protected readonly sent = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const email = this.email();
    if (email) this.form.controls.email.setValue(email);
  }

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (message) => {
        this.loading.set(false);
        this.sent.set(message);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const rest = applyServerErrors(this.form, err);
        if (!this.form.controls.email.hasError('server')) {
          this.error.set(Object.values(rest)[0] ?? errorMessage(err));
        }
      },
    });
  }
}
