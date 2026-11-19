import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <span class="eyebrow">Erreur 404</span>
      <h1>Page introuvable</h1>
      <p class="muted">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <a routerLink="/" class="btn btn-primary">Retour à l'accueil</a>
    </main>
  `,
})
export class NotFound {}
