import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Rendu dans le navigateur pour toutes les routes : le contenu vient de l'API Laravel
 * (indisponible au moment du build), et l'admin dépend du cookie de session.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
