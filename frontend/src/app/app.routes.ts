import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  // ------------------------------------------------------------ Site public
  {
    path: '',
    loadComponent: () => import('./site/layout/site-layout').then((m) => m.SiteLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./site/home/home').then((m) => m.Home),
      },
      {
        path: 'projets/:slug',
        loadComponent: () => import('./site/project-detail/project-detail').then((m) => m.ProjectDetail),
      },
    ],
  },

  // ------------------------------------------------------------ Administration
  {
    path: 'admin/connexion',
    title: 'Connexion · Portfolio Admin',
    canActivate: [guestGuard],
    loadComponent: () => import('./admin/login/login').then((m) => m.Login),
  },
  {
    path: 'admin/mot-de-passe-oublie',
    title: 'Mot de passe oublié · Portfolio Admin',
    canActivate: [guestGuard],
    loadComponent: () => import('./admin/password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    // Chemin imposé par le lien de l'e-mail (backend : portfolio.password_reset_path).
    path: 'admin/reset-password',
    title: 'Nouveau mot de passe · Portfolio Admin',
    canActivate: [guestGuard],
    loadComponent: () => import('./admin/password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },

  // ------------------------------------------------------------ 404
  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFound),
  },
];
