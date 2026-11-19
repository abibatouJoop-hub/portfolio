import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ADMIN_API, API } from './api.config';
import { ApiResponse, Experience, ExperienceType } from './models';

export interface ExperiencePayload {
  type: ExperienceType;
  title: string;
  organization: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  technologies: string[];
  sort_order?: number;
}

@Injectable({ providedIn: 'root' })
export class ExperiencesApi {
  private readonly http = inject(HttpClient);

  // Site public, du plus récent au plus ancien
  listPublic(): Observable<Experience[]> {
    return this.http.get<ApiResponse<Experience[]>>(`${API}/experiences`).pipe(map((r) => r.data));
  }

  // Admin
  list(type?: ExperienceType | null): Observable<Experience[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http
      .get<ApiResponse<Experience[]>>(`${ADMIN_API}/experiences`, { params })
      .pipe(map((r) => r.data));
  }

  create(data: ExperiencePayload): Observable<Experience> {
    return this.http.post<ApiResponse<Experience>>(`${ADMIN_API}/experiences`, data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<ExperiencePayload>): Observable<Experience> {
    return this.http
      .put<ApiResponse<Experience>>(`${ADMIN_API}/experiences/${id}`, data)
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_API}/experiences/${id}`);
  }
}
