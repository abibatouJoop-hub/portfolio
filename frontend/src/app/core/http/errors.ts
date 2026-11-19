import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ValidationErrors } from '../api/models';

/** Message lisible pour n'importe quelle erreur HTTP. */
export function errorMessage(error: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  switch (error.status) {
    case 0:
      return 'Le serveur est injoignable. Vérifiez votre connexion.';
    case 401:
      return 'Votre session a expiré. Reconnectez-vous.';
    case 403:
      return "Vous n'avez pas accès à cette action.";
    case 404:
      return 'Élément introuvable.';
    case 413:
      return 'Fichier trop volumineux.';
    case 429:
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 422:
      return (error.error as ValidationErrors)?.message ?? 'Certains champs sont invalides.';
    default:
      return (error.error as { message?: string })?.message || fallback;
  }
}

/** Erreurs de validation Laravel, champ par champ (vide si ce n'est pas un 422). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (error instanceof HttpErrorResponse && error.status === 422) {
    const errors = (error.error as ValidationErrors)?.errors ?? {};
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]));
  }
  return {};
}

/**
 * Reporte les erreurs 422 sur les contrôles du formulaire (« server »),
 * pour un affichage sous chaque champ. Renvoie les erreurs non rattachées.
 */
export function applyServerErrors(form: FormGroup, error: unknown): Record<string, string> {
  const errors = fieldErrors(error);
  const rest: Record<string, string> = {};

  for (const [field, message] of Object.entries(errors)) {
    const control: AbstractControl | null = form.get(field.split('.')[0]);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    } else {
      rest[field] = message;
    }
  }
  return rest;
}

/** Premier message d'erreur à afficher sous un contrôle. */
export function controlError(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return null;
  }
  const e = control.errors;
  if (e['server']) return e['server'];
  if (e['required']) return 'Ce champ est obligatoire.';
  if (e['email']) return 'Adresse e-mail invalide.';
  if (e['minlength']) return `${e['minlength'].requiredLength} caractères minimum.`;
  if (e['maxlength']) return `${e['maxlength'].requiredLength} caractères maximum.`;
  if (e['pattern']) return 'Format invalide.';
  if (e['url']) return 'Adresse invalide (commencez par https://).';
  if (e['min']) return `Valeur minimale : ${e['min'].min}.`;
  if (e['max']) return `Valeur maximale : ${e['max'].max}.`;
  return 'Valeur invalide.';
}
