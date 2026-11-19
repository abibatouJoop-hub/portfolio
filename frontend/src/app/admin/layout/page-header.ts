import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** En-tête d'une page admin : fil d'Ariane, titre et actions (projetées). */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <small class="breadcrumb">Administration{{ section() ? ' / ' + section() : '' }}</small>
        <h1>{{ title() }}</h1>
      </div>
      <div class="page-header-actions">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly section = input<string | null>(null);
}
