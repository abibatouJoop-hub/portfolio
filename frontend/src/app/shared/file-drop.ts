import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Icon } from './icon';

/** Zone « Choisir un fichier ou glisser-déposer », avec contrôle du type et de la taille. */
@Component({
  selector: 'app-file-drop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <label
      class="file-drop"
      [class.over]="over()"
      [class.busy]="busy()"
      (dragover)="$event.preventDefault(); over.set(true)"
      (dragleave)="over.set(false)"
      (drop)="onDrop($event)"
    >
      <input type="file" class="sr-only" [accept]="accept()" [disabled]="busy()" (change)="onPick($event)" />
      <app-icon name="upload" [size]="20" />
      <span>
        @if (busy()) {
          Envoi en cours…
        } @else {
          <strong>{{ label() }}</strong> ou glisser-déposer
        }
      </span>
      <small>{{ hint() }}</small>
      @if (error()) {
        <small class="field-error">{{ error() }}</small>
      }
    </label>
  `,
})
export class FileDrop {
  readonly accept = input('image/jpeg,image/png,image/webp');
  readonly maxSizeMb = input(2);
  readonly label = input('Choisir une image');
  readonly hint = input('JPG, PNG ou WebP — 2 Mo max.');
  readonly busy = input(false);

  readonly fileSelected = output<File>();

  protected readonly over = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onPick(event: Event): void {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    field.value = '';
    if (file) this.handle(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handle(file);
  }

  private handle(file: File): void {
    const accepted = this.accept().split(',').map((t) => t.trim());
    if (!accepted.includes(file.type)) {
      this.error.set('Format de fichier non accepté.');
      return;
    }
    if (file.size > this.maxSizeMb() * 1024 * 1024) {
      this.error.set(`Fichier trop lourd (${this.maxSizeMb()} Mo maximum).`);
      return;
    }
    this.error.set(null);
    this.fileSelected.emit(file);
  }
}
