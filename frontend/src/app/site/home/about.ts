import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Profile } from '../../core/api/models';
import { Icon } from '../../shared/icon';
import { RichTextPipe } from '../../shared/rich-text';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RichTextPipe],
  template: `
    <section id="a-propos" class="section section-alt">
      <div class="container two-cols">
        <div>
          <span class="eyebrow">À propos</span>
          <h2 class="section-title">{{ profile().about_title || 'À propos de moi' }}</h2>
        </div>

        <div class="about-body">
          @if (profile().about_text) {
            <div class="rich-text muted" [innerHTML]="profile().about_text | richText"></div>
          }

          @if (facts().length) {
            <div class="facts">
              @for (fact of facts(); track fact.label) {
                <div class="fact">
                  <app-icon [name]="fact.icon" [size]="18" />
                  <small>{{ fact.label }}</small>
                  <strong>{{ fact.value }}</strong>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class About {
  readonly profile = input.required<Profile>();

  protected readonly facts = computed(() => {
    const p = this.profile();
    return [
      { icon: 'map-pin', label: 'Localisation', value: p.location },
      { icon: 'graduation-cap', label: 'Formation', value: p.education },
      { icon: 'globe', label: 'Langues', value: (p.languages ?? []).join(', ') },
    ].filter((f) => !!f.value);
  });
}
