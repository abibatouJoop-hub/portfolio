import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SiteStore } from '../site-store';
import { About } from './about';
import { Contact } from './contact';
import { Hero } from './hero';
import { Projects } from './projects';
import { Skills } from './skills';
import { Timeline } from './timeline';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, About, Skills, Timeline, Projects, Contact],
  template: `
    @if (store.profile(); as profile) {
      <app-hero [profile]="profile" />
      <app-about [profile]="profile" />
    } @else if (store.loading()) {
      <section class="hero">
        <div class="container hero-grid">
          <div class="form-grid">
            <div class="skeleton" style="height: 28px; width: 260px"></div>
            <div class="skeleton" style="height: 180px"></div>
            <div class="skeleton" style="height: 60px"></div>
          </div>
          <div class="skeleton hero-photo"></div>
        </div>
      </section>
    } @else {
      <section class="hero">
        <div class="container">
          <p class="alert">Le contenu n'a pas pu être chargé. Vérifiez que l'API est démarrée puis rechargez la page.</p>
        </div>
      </section>
    }

    <app-skills />
    <app-timeline />
    <app-projects />
    <app-contact [profile]="store.profile()" />
  `,
})
export class Home {
  protected readonly store = inject(SiteStore);
  private readonly title = inject(Title);

  constructor() {
    effect(() => {
      const p = this.store.profile();
      if (p) this.title.setTitle(`${p.full_name} · ${p.title}`);
    });
  }
}
