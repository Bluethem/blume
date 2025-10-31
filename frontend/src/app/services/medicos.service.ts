// src/app/services/medicos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Medico, HorariosDisponibles, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MedicosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medicos`;

  /**
   * Obtener lista de médicos con filtros
   */
  getMedicos(params?: {
    q?: string;
    especialidad_id?: string;
    costo_max?: number;
    experiencia_min?: number;
    disponible_hoy?: boolean;
    orden?: 'nombre' | 'experiencia' | 'precio_asc' | 'precio_desc';
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Medico[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<Medico[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener detalle de un médico
   */
  getMedico(id: string): Observable<ApiResponse<Medico>> {
    return this.http.get<ApiResponse<Medico>>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ CORREGIDO: Obtener horarios disponibles de un médico
   * Endpoint correcto: GET /api/v1/medicos/:medico_id/horarios/disponibles?fecha=YYYY-MM-DD
   */
  getHorariosDisponibles(medicoId: string, fecha: string): Observable<ApiResponse<HorariosDisponibles>> {
    return this.http.get<ApiResponse<HorariosDisponibles>>(
      `${this.apiUrl}/${medicoId}/horarios/disponibles`, // ✅ CORREGIDO
      { params: { fecha } }
    );
  }

  /**
   * ✅ NUEVO: Obtener horarios de la semana de un médico
   */
  getHorariosSemana(medicoId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/${medicoId}/horarios/semana`
    );
  }

  /**
   * Buscar médicos disponibles
   */
  buscarMedicos(query: string): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(`${this.apiUrl}/buscar`, {
      params: { q: query }
    });
  }

  /**
   * ✅ NUEVO: Obtener médicos disponibles para una fecha y especialidad
   */
  getMedicosDisponibles(params?: {
    fecha?: string;
    especialidad_id?: string;
  }): Observable<ApiResponse<Medico[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          httpParams = httpParams.set(key, value);
        }
      });
    }
    
    return this.http.get<ApiResponse<Medico[]>>(`${this.apiUrl}/disponibles`, { params: httpParams });
  }

  /**
   * ✅ NUEVO: Obtener estadísticas del médico (solo para médicos y admins)
   */
  getEstadisticas(medicoId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${medicoId}/estadisticas`);
  }

  /**
   * ✅ NUEVO: Obtener citas del médico (solo para médicos y admins)
   */
  getCitasMedico(medicoId: string, params?: {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${medicoId}/citas`, { params: httpParams });
  }
}