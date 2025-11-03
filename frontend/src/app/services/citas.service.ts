import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cita } from '../models';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

interface ContadoresCitas {
  todas: number;
  proximas: number;
  completadas: number;
  canceladas: number;
}

export interface CrearCitaData {
  medico_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo_consulta: string;
  observaciones?: string;
}

export interface CrearCitaRequest {
  cita: CrearCitaData;
}

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/citas`;

  /**
   * Obtener todas las citas del paciente actual
   */
  getMisCitas(params?: {
    estado?: string;
    q?: string;
    fecha?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Cita[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/mis-citas`, { params: httpParams });
  }

  /**
   * Obtener próximas citas del paciente
   */
  getProximasCitas(params?: {
    limite?: number;
  }): Observable<ApiResponse<Cita[]>> {
    let httpParams = new HttpParams();
    
    if (params?.limite) {
      httpParams = httpParams.set('limite', params.limite.toString());
    }
    
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/proximas`, { params: httpParams });
  }

  /**
   * Obtener detalle de una cita
   */
  getCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.get<ApiResponse<Cita>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nueva cita
   */
  crearCita(data: CrearCitaRequest): Observable<ApiResponse<Cita>> {
    return this.http.post<ApiResponse<Cita>>(this.apiUrl, data);
  }

  /**
   * Actualizar una cita
   */
  actualizarCita(id: string, data: Partial<CrearCitaData>): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}`, { cita: data });
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
   * Confirmar asistencia a una cita
   */
  confirmarCita(id: string): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  /**
   * Completar una cita (solo médico)
   */
  completarCita(id: string, data: {
    diagnostico?: string;
    observaciones?: string;
  }): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/completar`, data);
  }

  /**
   * Obtener contadores de citas por estado
   */
  getContadoresCitas(): Observable<ApiResponse<ContadoresCitas>> {
    return this.http.get<ApiResponse<ContadoresCitas>>(`${this.apiUrl}/contadores`);
  }

  /**
   * Obtener historial de citas del paciente
   */
  getHistorialCitas(params?: {
    medico_id?: string;
    especialidad_id?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Cita[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/historial`, { params: httpParams });
  }

  /**
   * Verificar disponibilidad para agendar
   */
  verificarDisponibilidad(medicoId: string, fecha: string, hora: string): Observable<ApiResponse<{
    disponible: boolean;
    mensaje?: string;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/verificar-disponibilidad`, {
      params: {
        medico_id: medicoId,
        fecha: fecha,
        hora: hora
      }
    });
  }

  /**
   * Reagendar una cita
   */
  reagendarCita(id: string, data: {
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
  }): Observable<ApiResponse<Cita>> {
    return this.http.put<ApiResponse<Cita>>(`${this.apiUrl}/${id}/reagendar`, data);
  }

  /**
   * Obtener citas de un médico específico (para vista de médico)
   */
  getCitasMedico(params?: {
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    paciente_id?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Cita[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/medico/mis-citas`, { params: httpParams });
  }

  /**
   * Buscar citas
   */
  buscarCitas(query: string): Observable<ApiResponse<Cita[]>> {
    return this.http.get<ApiResponse<Cita[]>>(`${this.apiUrl}/buscar`, {
      params: { q: query }
    });
  }

  /**
   * Eliminar una cita (solo admin)
   */
  eliminarCita(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  agregarCostoAdicional(citaId: string, monto: number, concepto: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${citaId}/agregar_costo_adicional`, {
      monto,
      concepto
    });
  }

  getCitasConPagosPendientes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/con_pagos_pendientes`);
  }
}