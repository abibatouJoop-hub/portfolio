import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ADMIN_API, API } from './api.config';
import { ApiResponse, Skill, SkillCategory } from './models';

export interface SkillPayload {
  skill_category_id: number;
  name: string;
  level: number;
  is_visible?: boolean;
  sort_order?: number;
}

@Injectable({ providedIn: 'root' })
export class SkillsApi {
  private readonly http = inject(HttpClient);

  // Site public : catégories avec leurs compétences visibles
  listVisibleGrouped(): Observable<SkillCategory[]> {
    return this.http.get<ApiResponse<SkillCategory[]>>(`${API}/skills`).pipe(map((r) => r.data));
  }

  // Admin : catégories avec toutes leurs compétences
  listCategories(): Observable<SkillCategory[]> {
    return this.http.get<ApiResponse<SkillCategory[]>>(`${ADMIN_API}/skill-categories`).pipe(map((r) => r.data));
  }

  createCategory(data: { name: string; sort_order?: number }): Observable<SkillCategory> {
    return this.http
      .post<ApiResponse<SkillCategory>>(`${ADMIN_API}/skill-categories`, data)
      .pipe(map((r) => r.data));
  }

  updateCategory(id: number, data: { name?: string; sort_order?: number }): Observable<SkillCategory> {
    return this.http
      .put<ApiResponse<SkillCategory>>(`${ADMIN_API}/skill-categories/${id}`, data)
      .pipe(map((r) => r.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_API}/skill-categories/${id}`);
  }

  create(data: SkillPayload): Observable<Skill> {
    return this.http.post<ApiResponse<Skill>>(`${ADMIN_API}/skills`, data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<SkillPayload>): Observable<Skill> {
    return this.http.put<ApiResponse<Skill>>(`${ADMIN_API}/skills/${id}`, data).pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${ADMIN_API}/skills/${id}`);
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.patch<void>(`${ADMIN_API}/skills/reorder`, { ids });
  }
}
