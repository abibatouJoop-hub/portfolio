import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/ui/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class.error]="toast.type === 'error'" role="status">
          <app-icon [name]="toast.type === 'error' ? 'info' : 'check'" [size]="16" />
          <span>{{ toast.text }}</span>
          <button type="button" class="icon-btn ghost" (click)="toasts.dismiss(toast.id)" aria-label="Fermer">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly toasts = inject(ToastService);
}
