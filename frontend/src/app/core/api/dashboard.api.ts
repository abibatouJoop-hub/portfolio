import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ADMIN_API } from './api.config';
import { ApiResponse, Dashboard } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  get(): Observable<Dashboard> {
    return this.http.get<ApiResponse<Dashboard>>(`${ADMIN_API}/dashboard`).pipe(map((r) => r.data));
  }
}
