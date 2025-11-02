// src/app/core/services/reprogramaciones.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reprogramacion,
  ReprogramacionDetallada,
  ReprogramacionesResponse,
  SolicitarReprogramacionRequest,
  AprobarReprogramacionRequest,
  RechazarReprogramacionRequest,
  RegistrarFaltaRequest
} from '../models/reprogramacion.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReprogramacionesService {
  private readonly pacienteUrl = `${environment.apiUrl}/paciente/reprogramaciones`;
  private readonly medicoUrl = `${environment.apiUrl}/medico/reprogramaciones`;

  constructor(private http: HttpClient) {}

  // ==================== PACIENTE ====================

  /**
   * Obtener lista de reprogramaciones del paciente
   */
  getReprogramacionesPaciente(params?: {
    page?: number;
    per_page?: number;
    estado?: string;
  }): Observable<ApiResponse<ReprogramacionesResponse>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
    }

    return this.http.get<ApiResponse<ReprogramacionesResponse>>(
      this.pacienteUrl,
      { params: httpParams }
    );
  }

  /**
   * Obtener detalle de una reprogramación (paciente)
   */
  getReprogramacionPaciente(id: string): Observable<ApiResponse<ReprogramacionDetallada>> {
    return this.http.get<ApiResponse<ReprogramacionDetallada>>(`${this.pacienteUrl}/${id}`);
  }

  /**
   * Solicitar una reprogramación
   */
  solicitarReprogramacion(
    request: SolicitarReprogramacionRequest
  ): Observable<ApiResponse<Reprogramacion>> {
    return this.http.post<ApiResponse<Reprogramacion>>(this.pacienteUrl, request);
  }

  /**
   * Cancelar una reprogramación
   */
  cancelarReprogramacion(id: string, motivo?: string): Observable<ApiResponse<Reprogramacion>> {
    return this.http.put<ApiResponse<Reprogramacion>>(
      `${this.pacienteUrl}/${id}/cancelar`,
      { motivo }
    );
  }

  /**
   * Obtener reprogramaciones pendientes del paciente
   */
  getReprogramacionesPendientesPaciente(): Observable<ApiResponse<{
    reprogramaciones: Reprogramacion[];
    total: number;
  }>> {
    return this.http.get<ApiResponse<{ reprogramaciones: Reprogramacion[]; total: number }>>(
      `${this.pacienteUrl}/pendientes`
    );
  }

  // ==================== MÉDICO ====================

  /**
   * Obtener lista de reprogramaciones del médico
   */
  getReprogramacionesMedico(params?: {
    page?: number;
    per_page?: number;
    estado?: string;
    motivo?: string;
  }): Observable<ApiResponse<ReprogramacionesResponse>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
      if (params.motivo) httpParams = httpParams.set('motivo', params.motivo);
    }

    return this.http.get<ApiResponse<ReprogramacionesResponse>>(
      this.medicoUrl,
      { params: httpParams }
    );
  }

  /**
   * Obtener detalle de una reprogramación (médico)
   */
  getReprogramacionMedico(id: string): Observable<ApiResponse<ReprogramacionDetallada>> {
    return this.http.get<ApiResponse<ReprogramacionDetallada>>(`${this.medicoUrl}/${id}`);
  }

  /**
   * Obtener reprogramaciones pendientes del médico
   */
  getReprogramacionesPendientesMedico(): Observable<ApiResponse<{
    reprogramaciones: Reprogramacion[];
    total: number;
  }>> {
    return this.http.get<ApiResponse<{ reprogramaciones: Reprogramacion[]; total: number }>>(
      `${this.medicoUrl}/pendientes`
    );
  }

  /**
   * Aprobar una reprogramación
   */
  aprobarReprogramacion(
    id: string,
    request: AprobarReprogramacionRequest
  ): Observable<ApiResponse<ReprogramacionDetallada>> {
    return this.http.put<ApiResponse<ReprogramacionDetallada>>(
      `${this.medicoUrl}/${id}/aprobar`,
      request
    );
  }

  /**
   * Rechazar una reprogramación
   */
  rechazarReprogramacion(
    id: string,
    request: RechazarReprogramacionRequest
  ): Observable<ApiResponse<Reprogramacion>> {
    return this.http.put<ApiResponse<Reprogramacion>>(
      `${this.medicoUrl}/${id}/rechazar`,
      request
    );
  }

  /**
   * Registrar falta de paciente o médico
   */
  registrarFalta(request: RegistrarFaltaRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.medicoUrl}/registrar_falta`,
      request
    );
  }
}
