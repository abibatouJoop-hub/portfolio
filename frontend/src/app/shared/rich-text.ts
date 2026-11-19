import { Pipe, PipeTransform } from '@angular/core';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mise en forme légère du texte « À propos » : **gras**, *italique*, [lien](https://…)
 * et paragraphes. Le texte est échappé AVANT la mise en forme : aucun HTML saisi
 * n'est interprété, et seuls les liens http(s) sont acceptés.
 * (Le résultat passe en plus par le nettoyage d'Angular via [innerHTML].)
 */
export function renderRichText(text: string | null | undefined): string {
  if (!text) return '';

  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        )
        .replace(/\n/g, '<br>'),
    )
    .map((p) => `<p>${p}</p>`)
    .join('');
}

@Pipe({ name: 'richText' })
export class RichTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return renderRichText(value);
  }
}
