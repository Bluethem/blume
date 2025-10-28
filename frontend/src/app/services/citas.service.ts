import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface CrearCitaRequest {
  cita: {
    medico_id: string;
    fecha_hora_inicio: string;
    motivo_consulta: string;
    observaciones?: string;
  };
}

export interface Cita {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  estado_label: string;
  motivo_consulta: string;
  observaciones?: string;
  diagnostico?: string;
  costo: number;
  puede_cancelar: boolean;
  medico: {
    id: string;
    nombre_completo: string;
    especialidad: string;
    foto_url?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/paciente/citas`;

  /**
   * Crear nueva cita
   */
  crearCita(citaData: CrearCitaRequest): Observable<ApiResponse<Cita>> {
    return this.http.post<ApiResponse<Cita>>(this.apiUrl, citaData);
  }

  /**
   * Obtener mis citas
   */
  getMisCitas(params?: {
    estado?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Cita[]>> {
    return this.http.get<ApiResponse<Cita[]>>(this.apiUrl, { params: params as any });
  }

  /**
   * Obtener detalle de cita
   */
  getCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.get<ApiResponse<Cita>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cancelar cita
   */
  cancelarCita(id: string, motivo?: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}/cancelar`, {
      motivo_cancelacion: motivo
    });
  }
}