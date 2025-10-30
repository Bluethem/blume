import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MedicoDashboardData } from '../models/medico-dashboard.models';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicoDashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medico/dashboard`;

  /**
   * Obtener datos del dashboard del médico
   */
  getDashboard(): Observable<ApiResponse<MedicoDashboardData>> {
    return this.http.get<ApiResponse<MedicoDashboardData>>(this.apiUrl);
  }

  /**
   * Obtener estadísticas detalladas
   */
  getEstadisticas(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/estadisticas`);
  }
}
