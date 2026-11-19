import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Saisie de technologies sous forme d'étiquettes : Entrée ou virgule pour ajouter,
 * Retour arrière pour retirer la dernière. Valeur : string[].
 */
@Component({
  selector: 'app-tag-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TagInput), multi: true }],
  template: `
    <div class="tag-input" [class.disabled]="disabled()" (click)="field.focus()">
      @for (tag of tags(); track tag) {
        <span class="tag">
          {{ tag }}
          <button type="button" (click)="remove(tag); $event.stopPropagation()" [attr.aria-label]="'Retirer ' + tag">×</button>
        </span>
      }
      <input
        #field
        type="text"
        [id]="inputId()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        maxlength="50"
        (keydown)="onKeydown($event, field)"
        (blur)="commit(field)"
      />
    </div>
  `,
})
export class TagInput implements ControlValueAccessor {
  readonly placeholder = input('Ajouter…');
  readonly inputId = input<string | null>(null);
  readonly max = input(20);

  protected readonly tags = signal<string[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string[] | null): void {
    this.tags.set(Array.isArray(value) ? [...value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onKeydown(event: KeyboardEvent, field: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commit(field);
    } else if (event.key === 'Backspace' && field.value === '' && this.tags().length > 0) {
      this.remove(this.tags()[this.tags().length - 1]);
    }
  }

  protected commit(field: HTMLInputElement): void {
    const values = field.value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    field.value = '';
    this.onTouched();
    if (values.length === 0) return;

    const next = [...this.tags()];
    for (const v of values) {
      if (next.length < this.max() && !next.some((t) => t.toLowerCase() === v.toLowerCase())) {
        next.push(v);
      }
    }
    this.update(next);
  }

  protected remove(tag: string): void {
    this.update(this.tags().filter((t) => t !== tag));
  }

  private update(next: string[]): void {
    this.tags.set(next);
    this.onChange(next);
  }
}
