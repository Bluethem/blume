import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Cita, ApiResponse } from '../../../../models';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/citas`;

  /**
   * Obtener todas las citas del usuario actual
   */
  getMisCitas(filtros?: CitasFiltros): Observable<ApiResponse<Cita[]>> {
    let params = new HttpParams();
    
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.medico_id) {
      params = params.set('medico_id', filtros.medico_id);
    }
    if (filtros?.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde);
    }
    if (filtros?.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    }

    return this.http.get<ApiResponse<Cita[]>>(this.apiUrl, { params });
  }

  /**
   * Obtener citas pendientes
   */
  getCitasPendientes(): Observable<ApiResponse<Cita[]>> {
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/pendientes`);
  }

  /**
   * Obtener próximas citas
   */
  getProximasCitas(): Observable<ApiResponse<Cita[]>> {
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/proximas`);
  }

  /**
   * Obtener historial de citas
   */
  getHistorialCitas(page: number = 1): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/historial`, { params });
  }

  /**
   * Obtener una cita por ID
   */
  getCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.get<ApiResponse<Cita>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear una nueva cita
   */
  crearCita(citaData: CrearCitaRequest): Observable<ApiResponse<Cita>> {
    return this.http.post<ApiResponse<Cita>>(this.apiUrl, { cita: citaData });
  }

  /**
   * Cancelar una cita
   */
  cancelarCita(id: string, motivo: string): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivo
    });
  }

  /**
   * Confirmar una cita
   */
  confirmarCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  /**
   * Reprogramar una cita
   */
  reprogramarCita(id: string, nuevaFecha: string): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/reprogramar`, {
      nueva_fecha: nuevaFecha
    });
  }
}

// Interfaces auxiliares
export interface CitasFiltros {
  estado?: string;
  medico_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface CrearCitaRequest {
  medico_id: string;
  fecha_hora_inicio: string;
  motivo_consulta: string;
  observaciones?: string;
}