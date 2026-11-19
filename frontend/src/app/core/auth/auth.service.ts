import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { API, ADMIN_API, CSRF_COOKIE_URL } from '../api/api.config';
import { ApiResponse, User } from '../api/models';

/**
 * Authentification Sanctum en mode SPA : la session est portée par un cookie HttpOnly.
 * Aucun jeton n'est stocké dans le navigateur ; on garde seulement l'utilisateur en mémoire.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<User | null>(null);
  /** undefined = pas encore vérifié auprès du serveur */
  private checked: Promise<boolean> | null = null;

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  /** Pose le cookie XSRF-TOKEN (à appeler avant toute requête d'écriture « invitée »). */
  csrf(): Observable<void> {
    return this.http.get<void>(CSRF_COOKIE_URL);
  }

  login(email: string, password: string, remember: boolean): Observable<User> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<ApiResponse<User>>(`${API}/auth/login`, { email, password, remember })),
      map((r) => r.data),
      tap((user) => {
        this._user.set(user);
        this.checked = Promise.resolve(true);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API}/auth/logout`, {}).pipe(
      catchError(() => of(undefined)),
      map(() => undefined),
      tap(() => this.clear()),
    );
  }

  /** Vérifie une seule fois (par chargement de page) si une session est ouverte. */
  check(): Promise<boolean> {
    this.checked ??= firstValueFrom(
      this.http.get<ApiResponse<User>>(`${API}/auth/me`).pipe(
        map((r) => {
          this._user.set(r.data);
          return true;
        }),
        catchError(() => {
          this._user.set(null);
          return of(false);
        }),
      ),
    );
    return this.checked;
  }

  /** Session expirée ou déconnexion : on oublie l'utilisateur. */
  clear(): void {
    this._user.set(null);
    this.checked = Promise.resolve(false);
  }

  /** « Mot de passe oublié ? » : le backend répond la même chose que l'adresse existe ou non. */
  forgotPassword(email: string): Observable<string> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<{ message: string }>(`${API}/auth/forgot-password`, { email })),
      map((r) => r.message),
    );
  }

  /** Nouveau mot de passe avec le jeton reçu par e-mail. */
  resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }): Observable<string> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<{ message: string }>(`${API}/auth/reset-password`, data)),
      map((r) => r.message),
    );
  }

  updatePassword(data: { current_password: string; password: string; password_confirmation: string }): Observable<void> {
    return this.http.put<void>(`${ADMIN_API}/password`, data);
  }
}
