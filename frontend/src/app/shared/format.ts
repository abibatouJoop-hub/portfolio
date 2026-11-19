import { Pipe, PipeTransform } from '@angular/core';
import { Experience } from '../core/api/models';

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const full = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « 2024-09-01 » → Date locale (sans décalage de fuseau). */
function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Période d'une expérience : « Sept. 2024 – Aujourd'hui », « 2019 – 2022 » pour une formation. */
export function periodLabel(e: Pick<Experience, 'type' | 'start_date' | 'end_date' | 'is_current'>): string {
  const fmt = (v: string) =>
    e.type === 'education' ? String(parseDate(v).getFullYear()) : capitalize(monthYear.format(parseDate(v)));
  const end = e.is_current || !e.end_date ? "Aujourd'hui" : fmt(e.end_date);
  return `${fmt(e.start_date)} – ${end}`;
}

/** Date courte façon boîte mail : « 20:14 », « Hier », « Lun. », « 12 nov. ». */
export function shortDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (days <= 0) return time.format(date);
  if (days === 1) return 'Hier';
  if (days < 7) return capitalize(weekday.format(date));
  return dayMonth.format(date);
}

/** Date relative : « Il y a 2 h », « Aujourd'hui », « Hier », « 10 nov. ». */
export function relativeDate(value: string | null | undefined, withHours = false): string {
  if (!value) return '';
  const date = new Date(value);
  const diffMin = Math.round((Date.now() - date.getTime()) / 60_000);
  if (withHours && diffMin < 60) return diffMin <= 1 ? "À l'instant" : `Il y a ${diffMin} min`;
  if (withHours && diffMin < 24 * 60 && date.getDate() === new Date().getDate()) return `Il y a ${Math.round(diffMin / 60)} h`;
  const s = shortDate(value);
  return s.includes(':') ? "Aujourd'hui" : s;
}

export function fullDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return `${full.format(date)} · ${time.format(date)}`;
}

/** Initiales d'un nom : « Marie Dupont » → « MD ». */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Pastille d'une catégorie de compétences : « Backend » → « BE », « Outils & méthodes » → « OU ». */
export function categoryBadge(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  const compound = first.match(/^(\w)\w*(end)$/i); // backend, frontend
  return (compound ? compound[1] + 'E' : first.slice(0, 2)).toUpperCase();
}

@Pipe({ name: 'period' })
export class PeriodPipe implements PipeTransform {
  transform(e: Experience): string {
    return periodLabel(e);
  }
}

@Pipe({ name: 'shortDate' })
export class ShortDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return shortDate(value);
  }
}

@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | null | undefined, withHours = false): string {
    return relativeDate(value, withHours);
  }
}

@Pipe({ name: 'fullDateTime' })
export class FullDateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return fullDateTime(value);
  }
}

@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return initials(value);
  }
}
