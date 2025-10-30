import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CitaMedico, FiltrosCitas, CitasResponse, CompletarCitaRequest, CancelarCitaRequest } from '../models/medico-citas.models';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicoCitasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medico/citas`;

  /**
   * Obtener lista de citas del médico
   */
  getMisCitas(filtros?: FiltrosCitas): Observable<ApiResponse<CitasResponse>> {
    let params = new HttpParams();
    
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.fecha_desde) {
      params = params.set('fecha_desde', filtros.fecha_desde);
    }
    if (filtros?.fecha_hasta) {
      params = params.set('fecha_hasta', filtros.fecha_hasta);
    }
    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }
    if (filtros?.page) {
      params = params.set('page', filtros.page.toString());
    }
    if (filtros?.per_page) {
      params = params.set('per_page', filtros.per_page.toString());
    }

    return this.http.get<ApiResponse<CitasResponse>>(this.apiUrl, { params });
  }

  /**
   * Obtener detalle de una cita
   */
  getCita(citaId: string): Observable<ApiResponse<CitaMedico>> {
    return this.http.get<ApiResponse<CitaMedico>>(`${this.apiUrl}/${citaId}`);
  }

  /**
   * Completar una cita
   */
  completarCita(citaId: string, data: CompletarCitaRequest): Observable<ApiResponse<CitaMedico>> {
    return this.http.put<ApiResponse<CitaMedico>>(`${this.apiUrl}/${citaId}/completar`, data);
  }

  /**
   * Cancelar una cita
   */
  cancelarCita(citaId: string, data: CancelarCitaRequest): Observable<ApiResponse<CitaMedico>> {
    return this.http.put<ApiResponse<CitaMedico>>(`${this.apiUrl}/${citaId}/cancelar`, data);
  }

  /**
   * Agendar nueva cita
   */
  agendarCita(data: any): Observable<ApiResponse<CitaMedico>> {
    return this.http.post<ApiResponse<CitaMedico>>(this.apiUrl, data);
  }
}
