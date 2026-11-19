import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protège /admin : redirige vers la page de connexion si aucune session n'est ouverte. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return (await auth.check()) ? true : router.createUrlTree(['/admin/connexion'], { queryParams: { retour: state.url } });
};

/** Page de connexion : inutile si l'administratrice est déjà connectée. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return (await auth.check()) ? router.createUrlTree(['/admin']) : true;
};
