import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { controlError, errorMessage, fieldErrors } from '../../core/http/errors';
import { Icon } from '../../shared/icon';
import { AuthAside } from './auth-aside';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Icon, AuthAside],
  template: `
    <div class="login-page">
      <app-auth-aside />

      <main class="login-main">
        <form class="card login-card form-grid" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <span class="login-icon"><app-icon name="lock" [size]="20" /></span>
          <div>
            <h2>Connexion</h2>
            <p class="muted">Connectez-vous à votre espace d'administration.</p>
          </div>

          <div class="field">
            <label for="email">Adresse e-mail</label>
            <input id="email" type="email" class="input" formControlName="email" placeholder="vous@exemple.com" autocomplete="username" />
            @if (err('email'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>

          <div class="field">
            <div class="label-row">
              <label for="password">Mot de passe</label>
              <a routerLink="/admin/mot-de-passe-oublie" [queryParams]="{ email: form.controls.email.value || null }" class="link-subtle">
                Mot de passe oublié ?
              </a>
            </div>
            <input id="password" type="password" class="input" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
            @if (err('password'); as e) {
              <small class="field-error">{{ e }}</small>
            }
          </div>

          <label class="checkbox">
            <input type="checkbox" formControlName="remember" /> Se souvenir de moi
          </label>

          @if (error()) {
            <p class="alert" role="alert">{{ error() }}</p>
          }

          <button type="submit" class="btn btn-primary lg block" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
            }
            Se connecter
          </button>

          <a routerLink="/" class="login-back"><app-icon name="arrow-left" [size]="14" /> Retour au site public</a>
        </form>
      </main>
    </div>
  `,
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** ?retour=/admin/projets : page demandée avant la redirection. */
  readonly retour = input<string>();
  /** ?email=… : pré-remplit l'adresse (retour depuis « Nouveau mot de passe »). */
  readonly email = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
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
    const { email, password, remember } = this.form.getRawValue();

    this.auth.login(email, password, remember).subscribe({
      next: () => {
        const target = this.retour();
        void this.router.navigateByUrl(target?.startsWith('/admin') ? target : '/admin');
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.form.controls.password.reset();
        // « Identifiants incorrects. » (422) ou « Trop de tentatives » (429) : affiché en haut du formulaire.
        const errors = fieldErrors(err);
        this.error.set(errors['email'] ?? errors['password'] ?? errorMessage(err));
      },
    });
  }
}
