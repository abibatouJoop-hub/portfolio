import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Panneau sombre à gauche des pages invitées (connexion, mot de passe oublié…). */
@Component({
  selector: 'app-auth-aside',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'login-aside' },
  template: `
    <div class="sidebar-brand">
      <span class="logo-mark light">AJ</span>
      <strong>Portfolio · Admin</strong>
    </div>
    <div class="login-pitch">
      <h1>Gardez votre portfolio à jour, en quelques clics.</h1>
      <p>Ajoutez vos nouveaux projets, compétences et expériences : ils apparaissent immédiatement sur votre site public.</p>
    </div>
    <small>Accès strictement réservé à l'administratrice.</small>
  `,
})
export class AuthAside {}
