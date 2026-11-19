import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ADMIN_API, API, fileForm } from './api.config';
import { ApiResponse, Project, ProjectCategory, ProjectStatus } from './models';

export interface ProjectPayload {
  title: string;
  summary: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  is_featured: boolean;
  demo_url: string | null;
  repo_url: string | null;
  sort_order: number;
  technologies: string[];
}

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly http = inject(HttpClient);

  // Site public
  listPublished(category?: ProjectCategory | null): Observable<Project[]> {
    const params = category ? new HttpParams().set('category', category) : undefined;
    return this.http.get<ApiResponse<Project[]>>(`${API}/projects`, { params }).pipe(map((r) => r.data));
  }

  findBySlug(slug: string): Observable<Project> {
    return this.http
      .get<ApiResponse<Project>>(`${API}/projects/${encodeURIComponent(slug)}`)
      .pipe(map((r) => r.data));
  }

  // Admin
  list(status?: ProjectStatus | null): Observable<Project[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApiResponse<Project[]>>(`${ADMIN_API}/projects`, { params }).pipe(map((r) => r.data));
  }

  create(data: ProjectPayload): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(`${ADMIN_API}/projects`, data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<ProjectPayload>): Observable<Project> {
    return this.http.put<ApiResponse<Project>>(`${ADMIN_API}/projects/${id}`, data).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_API}/projects/${id}`);
  }

  uploadCover(id: number, file: File): Observable<Project> {
    return this.http
      .post<ApiResponse<Project>>(`${ADMIN_API}/projects/${id}/cover`, fileForm(file))
      .pipe(map((r) => r.data));
  }

  deleteCover(id: number): Observable<Project> {
    return this.http.delete<ApiResponse<Project>>(`${ADMIN_API}/projects/${id}/cover`).pipe(map((r) => r.data));
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.patch<void>(`${ADMIN_API}/projects/reorder`, { ids });
  }
}
