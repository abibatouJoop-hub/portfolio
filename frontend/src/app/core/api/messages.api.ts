import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ADMIN_API, API } from './api.config';
import { ApiResponse, ContactMessage, ContactPayload, MessageFilter, Paginated } from './models';

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private readonly http = inject(HttpClient);

  /** Nombre de messages non lus, affiché dans la barre latérale de l'admin. */
  readonly unreadCount = signal(0);

  // Site public : formulaire de contact (5 envois par heure et par IP)
  send(data: ContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API}/contact`, data);
  }

  // Admin : boîte de réception paginée
  list(filter: MessageFilter = 'inbox', page = 1): Observable<Paginated<ContactMessage>> {
    const params = new HttpParams().set('filter', filter).set('page', page);
    return this.http
      .get<Paginated<ContactMessage>>(`${ADMIN_API}/messages`, { params })
      .pipe(tap((r) => this.unreadCount.set(r.meta.unread_count ?? 0)));
  }

  /** Ouvrir un message le marque comme lu côté serveur. */
  open(id: number): Observable<ContactMessage> {
    return this.http.get<ApiResponse<ContactMessage>>(`${ADMIN_API}/messages/${id}`).pipe(map((r) => r.data));
  }

  update(id: number, data: { read?: boolean; archived?: boolean }): Observable<ContactMessage> {
    return this.http
      .patch<ApiResponse<ContactMessage>>(`${ADMIN_API}/messages/${id}`, data)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_API}/messages/${id}`);
  }

  /** Recharge uniquement le compteur de non lus. */
  refreshUnreadCount(): void {
    this.list('unread').subscribe({ error: () => undefined });
  }
}
