import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessagesApi } from '../../core/api/messages.api';
import { Profile } from '../../core/api/models';
import { applyServerErrors, controlError, errorMessage } from '../../core/http/errors';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Icon],
  template: `
    <section id="contact" class="section">
      <div class="container">
        <div class="contact-card">
          <div class="contact-intro">
            <span class="eyebrow">Contact</span>
            <h2>Travaillons ensemble</h2>
            <p>Une opportunité, un projet ou simplement une question ? Écrivez-moi, je réponds rapidement.</p>
            <ul>
              @if (profile()?.contact_email; as email) {
                <li>
                  <app-icon name="mail" [size]="16" /><a [href]="'mailto:' + email">{{ email }}</a>
                </li>
              }
              @if (profile()?.phone; as phone) {
                <li><app-icon name="phone" [size]="16" />{{ phone }}</li>
              }
              @if (profile()?.location; as location) {
                <li><app-icon name="map-pin" [size]="16" />{{ location }}</li>
              }
            </ul>
          </div>

          @if (sent()) {
            <div class="contact-success" role="status">
              <app-icon name="check" [size]="28" />
              <h3>Message envoyé</h3>
              <p>{{ sent() }}</p>
              <button type="button" class="btn btn-accent" (click)="sent.set(null)">Envoyer un autre message</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid contact-form" novalidate>
              <div class="form-row">
                <div class="field">
                  <label for="c-name">Nom</label>
                  <input id="c-name" class="input" formControlName="name" placeholder="Votre nom" autocomplete="name" />
                  @if (err('name'); as e) {
                    <small class="field-error">{{ e }}</small>
                  }
                </div>
                <div class="field">
                  <label for="c-email">E-mail</label>
                  <input id="c-email" class="input" type="email" formControlName="email" placeholder="vous@exemple.com" autocomplete="email" />
                  @if (err('email'); as e) {
                    <small class="field-error">{{ e }}</small>
                  }
                </div>
              </div>
              <div class="field">
                <label for="c-subject">Sujet</label>
                <input id="c-subject" class="input" formControlName="subject" placeholder="Objet de votre message" />
                @if (err('subject'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>
              <div class="field">
                <label for="c-body">Message</label>
                <textarea id="c-body" class="input" rows="5" formControlName="body" placeholder="Votre message…"></textarea>
                @if (err('body'); as e) {
                  <small class="field-error">{{ e }}</small>
                }
              </div>

              <!-- Champ piège : invisible pour un humain, rempli par les robots (refusé par l'API). -->
              <div class="hp-field" aria-hidden="true">
                <label for="c-website">Site web</label>
                <input id="c-website" formControlName="website" tabindex="-1" autocomplete="off" />
              </div>

              @if (error()) {
                <p class="alert" role="alert">{{ error() }}</p>
              }

              <div>
                <button type="submit" class="btn btn-accent lg" [disabled]="sending()">
                  @if (sending()) {
                    <span class="spinner"></span> Envoi…
                  } @else {
                    Envoyer le message <app-icon name="send" [size]="16" />
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </section>
  `,
})
export class Contact {
  private readonly api = inject(MessagesApi);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly profile = input<Profile | null>(null);

  protected readonly sending = signal(false);
  protected readonly sent = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    website: [''],
  });

  protected err(name: string): string | null {
    return controlError(this.form.get(name));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    const { website, ...data } = this.form.getRawValue();
    this.api.send(website ? { ...data, website } : data).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.sent.set(res.message);
        this.form.reset();
      },
      error: (err: unknown) => {
        this.sending.set(false);
        const rest = applyServerErrors(this.form, err);
        this.error.set(Object.values(rest)[0] ?? errorMessage(err, "Le message n'a pas pu être envoyé."));
      },
    });
  }
}
