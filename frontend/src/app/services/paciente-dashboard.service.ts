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
export class PacienteDashboardService {
  private apiUrl = `${environment.apiUrl}/paciente`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener datos del dashboard del paciente
   */
  getDashboard(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Obtener estadísticas detalladas
   */
  getEstadisticasDetalladas(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/dashboard/estadisticas`);
  }

  /**
   * Obtener citas del paciente
   */
  getCitas(params?: {
    estado?: string;
    proximas?: boolean;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/citas`, { params: params as any });
  }

  /**
   * Obtener detalle de una cita
   */
  getCita(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/citas/${id}`);
  }

  /**
   * Crear nueva cita
   */
  crearCita(citaData: {
    medico_id: string;
    fecha_hora_inicio: string;
    motivo_consulta: string;
    observaciones?: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/citas`, { cita: citaData });
  }

  /**
   * Cancelar cita
   */
  cancelarCita(id: string, motivo?: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/citas/${id}/cancelar`, {
      motivo_cancelacion: motivo
    });
  }

  /**
   * Reagendar cita
   */
  reagendarCita(id: string, nuevaFecha: string, medicoId?: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/citas/${id}/reagendar`, {
      fecha_hora_inicio: nuevaFecha,
      medico_id: medicoId
    });
  }
}