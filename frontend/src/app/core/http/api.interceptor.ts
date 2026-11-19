import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { API, CSRF_COOKIE_URL } from '../api/api.config';
import { AuthService } from '../auth/auth.service';

/** Marque une requête déjà rejouée après un 419, pour ne pas boucler. */
const RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * - Accept: application/json → Laravel répond 401/403/404/422 en JSON au lieu de rediriger.
 * - withCredentials → le cookie de session Sanctum accompagne chaque requête.
 * - 419 (jeton CSRF expiré) → on redemande un cookie CSRF et on rejoue la requête une fois.
 * - 401 sur une route admin → session expirée : retour à la page de connexion.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const isBackend = req.url.startsWith(API) || req.url.startsWith(CSRF_COOKIE_URL);
  if (!isBackend) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const request = req.clone({ withCredentials: true, setHeaders: { Accept: 'application/json' } });

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 419 && !req.context.get(RETRIED)) {
        return auth.csrf().pipe(switchMap(() => next(request.clone({ context: req.context.set(RETRIED, true) }))));
      }

      const isAuthCheck = req.url.endsWith('/auth/me') || req.url.endsWith('/auth/login');
      if (error.status === 401 && !isAuthCheck && req.url.startsWith(`${API}/admin`)) {
        auth.clear();
        void router.navigate(['/admin/connexion'], { queryParams: { retour: router.url } });
      }

      return throwError(() => error);
    }),
  );
};
