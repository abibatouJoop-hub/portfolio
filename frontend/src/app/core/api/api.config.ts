/**
 * Toutes les URL sont relatives : en développement, le proxy (proxy.conf.json)
 * les redirige vers Laravel. C'est indispensable pour le CSRF : l'intercepteur XSRF
 * d'Angular n'ajoute l'en-tête X-XSRF-TOKEN qu'aux URL relatives.
 */
export const API = '/api/v1';
export const ADMIN_API = `${API}/admin`;
export const CSRF_COOKIE_URL = '/sanctum/csrf-cookie';

/** Corps d'un envoi de fichier : le backend attend le champ « file ». */
export function fileForm(file: File): FormData {
  const form = new FormData();
  form.append('file', file);
  return form;
}
