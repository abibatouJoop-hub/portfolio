import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout';

/** Chargé à la demande : le code de l'admin n'alourdit pas le site public. */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord · Admin',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'projets',
        title: 'Projets · Admin',
        loadComponent: () => import('./projects/admin-projects').then((m) => m.AdminProjects),
      },
      {
        path: 'competences',
        title: 'Compétences · Admin',
        loadComponent: () => import('./skills/admin-skills').then((m) => m.AdminSkills),
      },
      {
        path: 'experiences',
        title: 'Expériences · Admin',
        loadComponent: () => import('./experiences/admin-experiences').then((m) => m.AdminExperiences),
      },
      {
        path: 'messages',
        title: 'Messages · Admin',
        loadComponent: () => import('./messages/admin-messages').then((m) => m.AdminMessages),
      },
      {
        path: 'profil',
        title: 'Profil · Admin',
        loadComponent: () => import('./profile/admin-profile').then((m) => m.AdminProfile),
      },
      {
        path: 'a-propos',
        title: 'Accueil & À propos · Admin',
        loadComponent: () => import('./about/admin-about').then((m) => m.AdminAbout),
      },
    ],
  },
];
