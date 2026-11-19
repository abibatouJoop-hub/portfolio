import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessagesApi } from '../../core/api/messages.api';
import { ContactMessage, MessageFilter } from '../../core/api/models';
import { errorMessage } from '../../core/http/errors';
import { ToastService } from '../../core/ui/toast.service';
import { FullDateTimePipe, InitialsPipe, ShortDatePipe } from '../../shared/format';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../layout/page-header';

@Component({
  selector: 'app-admin-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeader, Icon, InitialsPipe, ShortDatePipe, FullDateTimePipe],
  template: `
    <app-page-header title="Messages" section="Messages">
      <span class="muted header-note">Reçus via le formulaire de contact du site</span>
    </app-page-header>

    <div class="admin-content mail-layout" [class.reading]="current()">
      <section class="card mail-list">
        <div class="mail-list-head">
          <label class="search">
            <app-icon name="search" [size]="16" />
            <input type="search" placeholder="Rechercher un message…" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </label>
          <div class="pills">
            @for (f of filters; track f.value) {
              <button type="button" class="pill" [class.active]="filter() === f.value" (click)="changeFilter(f.value)">
                {{ f.label }}{{ counter(f.value) }}
              </button>
            }
          </div>
        </div>

        @if (loading() && messages().length === 0) {
          <div class="card-pad form-grid">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="skeleton" style="height: 56px"></div>
            }
          </div>
        } @else {
          <ul class="list mail-items">
            @for (m of visible(); track m.id) {
              <li>
                <button type="button" class="mail-item" [class.active]="current()?.id === m.id" [class.unread]="!m.is_read" (click)="open(m)">
                  <span class="avatar">{{ m.name | initials }}</span>
                  <span class="list-main">
                    <span class="mail-item-top">
                      <strong>{{ m.name }}</strong>
                      <small class="soft">{{ m.created_at | shortDate }}</small>
                    </span>
                    <span class="mail-subject">{{ m.subject }}</span>
                    <small class="soft ellipsis">{{ m.body }}</small>
                  </span>
                  <span class="unread-dot" [class.hidden]="m.is_read"></span>
                </button>
              </li>
            } @empty {
              <li class="empty-state">
                <app-icon name="mail" [size]="28" />
                {{ search() ? 'Aucun message ne correspond.' : 'Aucun message ici.' }}
              </li>
            }
          </ul>
          @if (page() < lastPage()) {
            <div class="card-pad center">
              <button type="button" class="btn btn-outline sm" (click)="loadMore()" [disabled]="loading()">Charger plus</button>
            </div>
          }
        }
      </section>

      <section class="card mail-detail">
        @if (current(); as m) {
          <div class="mail-toolbar">
            <button type="button" class="btn btn-outline sm mobile-only" (click)="current.set(null)">
              <app-icon name="arrow-left" [size]="14" /> Retour
            </button>
            <button type="button" class="btn btn-outline sm" (click)="toggleArchive(m)">
              <app-icon name="archive" [size]="15" /> {{ m.is_archived ? 'Désarchiver' : 'Archiver' }}
            </button>
            <button type="button" class="btn btn-outline sm" (click)="markUnread(m)" [disabled]="!m.is_read">
              <app-icon name="mail" [size]="15" /> Marquer non lu
            </button>
            <button type="button" class="icon-btn danger push-right" (click)="remove(m)" aria-label="Supprimer le message">
              <app-icon name="trash" [size]="15" />
            </button>
          </div>

          <article class="mail-body">
            <h2>{{ m.subject }}</h2>
            <div class="mail-from">
              <span class="avatar lg">{{ m.name | initials }}</span>
              <div>
                <strong>{{ m.name }}</strong>
                <a [href]="'mailto:' + m.email" class="muted">{{ m.email }}</a>
              </div>
              <small class="muted push-right">{{ m.created_at | fullDateTime }}</small>
            </div>
            <p class="pre-line">{{ m.body }}</p>
          </article>

          <div class="mail-footer">
            <a class="btn btn-primary" [href]="replyLink(m)">
              <app-icon name="reply" [size]="16" /> Répondre par e-mail
            </a>
            <small class="muted">Ouvre votre messagerie avec l'adresse de l'expéditeur.</small>
          </div>
        } @else {
          <div class="empty-state mail-empty">
            <app-icon name="mail" [size]="32" />
            <p>Sélectionnez un message pour le lire.</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class AdminMessages implements OnInit {
  private readonly api = inject(MessagesApi);
  private readonly toast = inject(ToastService);

  /** ?id=12 depuis le tableau de bord : ouvre ce message. */
  readonly id = input<string>();

  protected readonly filters: { value: MessageFilter; label: string }[] = [
    { value: 'inbox', label: 'Tous' },
    { value: 'unread', label: 'Non lus' },
    { value: 'archived', label: 'Archivés' },
  ];

  protected readonly filter = signal<MessageFilter>('inbox');
  protected readonly messages = signal<ContactMessage[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly lastPage = signal(1);
  protected readonly loading = signal(true);
  protected readonly search = signal('');
  protected readonly current = signal<ContactMessage | null>(null);

  protected readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.messages();
    return this.messages().filter((m) =>
      [m.name, m.email, m.subject, m.body].some((v) => v.toLowerCase().includes(q)),
    );
  });

  ngOnInit(): void {
    this.load(1);
    const id = Number(this.id());
    if (id) {
      this.api.open(id).subscribe({
        next: (m) => {
          this.current.set(m);
          this.replace(m);
          this.api.refreshUnreadCount();
        },
        error: () => undefined,
      });
    }
  }

  protected counter(filter: MessageFilter): string {
    if (filter === 'unread') return ` (${this.api.unreadCount()})`;
    return filter === this.filter() && !this.loading() ? ` (${this.total()})` : '';
  }

  protected changeFilter(filter: MessageFilter): void {
    if (filter === this.filter()) return;
    this.filter.set(filter);
    this.messages.set([]);
    this.load(1);
  }

  protected loadMore(): void {
    this.load(this.page() + 1);
  }

  private load(page: number): void {
    this.loading.set(true);
    this.api.list(this.filter(), page).subscribe({
      next: (res) => {
        this.messages.update((list) => (page === 1 ? res.data : [...list, ...res.data]));
        this.page.set(res.meta.current_page);
        this.lastPage.set(res.meta.last_page);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  protected open(m: ContactMessage): void {
    this.current.set(m);
    if (m.is_read) return;

    // Lecture = marqué comme lu côté serveur
    this.api.open(m.id).subscribe({
      next: (updated) => {
        this.replace(updated);
        if (this.current()?.id === updated.id) this.current.set(updated);
        this.api.unreadCount.update((n) => Math.max(0, n - 1));
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected markUnread(m: ContactMessage): void {
    this.api.update(m.id, { read: false }).subscribe({
      next: (updated) => {
        this.replace(updated);
        this.current.set(null);
        this.api.unreadCount.update((n) => n + 1);
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected toggleArchive(m: ContactMessage): void {
    const archived = !m.is_archived;
    this.api.update(m.id, { archived }).subscribe({
      next: (updated) => {
        // Le message quitte la liste courante (boîte de réception ↔ archives)
        this.messages.update((list) => list.filter((x) => x.id !== updated.id));
        this.total.update((n) => Math.max(0, n - 1));
        this.current.set(null);
        this.api.refreshUnreadCount();
        this.toast.success(archived ? 'Message archivé.' : 'Message replacé dans la boîte de réception.');
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected remove(m: ContactMessage): void {
    if (!confirm(`Supprimer définitivement le message de ${m.name} ?`)) return;
    this.api.delete(m.id).subscribe({
      next: () => {
        this.messages.update((list) => list.filter((x) => x.id !== m.id));
        this.total.update((n) => Math.max(0, n - 1));
        this.current.set(null);
        if (!m.is_read) this.api.unreadCount.update((n) => Math.max(0, n - 1));
        this.toast.success('Message supprimé.');
      },
      error: (err: unknown) => this.toast.error(errorMessage(err)),
    });
  }

  protected replyLink(m: ContactMessage): string {
    const subject = encodeURIComponent(`Re: ${m.subject}`);
    return `mailto:${m.email}?subject=${subject}`;
  }

  private replace(m: ContactMessage): void {
    this.messages.update((list) => list.map((x) => (x.id === m.id ? m : x)));
  }
}
