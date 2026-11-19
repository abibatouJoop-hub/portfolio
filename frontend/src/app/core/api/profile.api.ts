import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ADMIN_API, API, fileForm } from './api.config';
import { ApiResponse, Profile } from './models';

export type ProfileUpdate = Partial<Omit<Profile, 'full_name' | 'photo_url' | 'cv_url' | 'updated_at'>>;

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);

  // Site public
  getPublic(): Observable<Profile> {
    return this.http.get<ApiResponse<Profile>>(`${API}/profile`).pipe(map((r) => r.data));
  }

  // Admin (lu en base, sans cache)
  get(): Observable<Profile> {
    return this.http.get<ApiResponse<Profile>>(`${ADMIN_API}/profile`).pipe(map((r) => r.data));
  }

  update(data: ProfileUpdate): Observable<Profile> {
    return this.http.put<ApiResponse<Profile>>(`${ADMIN_API}/profile`, data).pipe(map((r) => r.data));
  }

  uploadFile(kind: 'photo' | 'cv', file: File): Observable<Profile> {
    return this.http
      .post<ApiResponse<Profile>>(`${ADMIN_API}/profile/${kind}`, fileForm(file))
      .pipe(map((r) => r.data));
  }

  deleteFile(kind: 'photo' | 'cv'): Observable<Profile> {
    return this.http.delete<ApiResponse<Profile>>(`${ADMIN_API}/profile/${kind}`).pipe(map((r) => r.data));
  }
}
