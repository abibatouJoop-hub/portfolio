import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Même règle que le backend (Password::defaults) : 12 caractères, majuscule, minuscule, chiffre. */
export function strongPassword(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '');
  if (!v) return null;
  const ok = v.length >= 12 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);
  return ok ? null : { server: '12 caractères minimum, avec majuscules, minuscules et chiffres.' };
}
