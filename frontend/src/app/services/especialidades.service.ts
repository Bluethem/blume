import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Especialidad } from '../models';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/especialidades`;

  /**
   * Obtener lista de todas las especialidades
   */
  getEspecialidades(params?: {
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Especialidad[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<Especialidad[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener detalle de una especialidad
   */
  getEspecialidad(id: string): Observable<ApiResponse<Especialidad>> {
    return this.http.get<ApiResponse<Especialidad>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Buscar especialidades por nombre
   */
  buscarEspecialidades(query: string): Observable<ApiResponse<Especialidad[]>> {
    return this.http.get<ApiResponse<Especialidad[]>>(`${this.apiUrl}/buscar`, {
      params: { q: query }
    });
  }

  /**
   * Obtener médicos de una especialidad
   */
  getMedicosDeEspecialidad(especialidadId: string, params?: {
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/${especialidadId}/medicos`,
      { params: httpParams }
    );
  }

  /**
   * Crear nueva especialidad (solo admin)
   */
  crearEspecialidad(especialidad: Partial<Especialidad>): Observable<ApiResponse<Especialidad>> {
    return this.http.post<ApiResponse<Especialidad>>(this.apiUrl, { especialidad });
  }

  /**
   * Actualizar especialidad (solo admin)
   */
  actualizarEspecialidad(id: string, especialidad: Partial<Especialidad>): Observable<ApiResponse<Especialidad>> {
    return this.http.put<ApiResponse<Especialidad>>(`${this.apiUrl}/${id}`, { especialidad });
  }

  /**
   * Eliminar especialidad (solo admin)
   */
  eliminarEspecialidad(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}