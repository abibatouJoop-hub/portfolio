import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/ui/theme.service';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Toasts],
  template: `<router-outlet /><app-toasts />`,
})
export class App {
  // Instancié dès le démarrage pour appliquer le thème mémorisé.
  protected readonly theme = inject(ThemeService);
}
