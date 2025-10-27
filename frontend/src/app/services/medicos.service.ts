import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicosService {
  private apiUrl = `${environment.apiUrl}/medicos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de médicos
   */
  getMedicos(params?: {
    especialidad?: string;
    q?: string;
    orden?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl, { params: params as any });
  }

  /**
   * Obtener detalle de un médico
   */
  getMedico(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener horarios disponibles de un médico
   */
  getHorariosDisponibles(id: string, fecha?: string): Observable<ApiResponse> {
    const params = fecha ? { fecha } : {};
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}/horarios_disponibles`, { params });
  }

  /**
   * Obtener lista de especialidades
   */
  getEspecialidades(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/especialidades`);
  }
}