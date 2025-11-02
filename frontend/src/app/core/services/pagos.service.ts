// src/app/core/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Pago,
  PagoDetallado,
  PagosResponse,
  CrearPagoRequest,
  EstadisticasPagos
} from '../models/pago.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private apiUrl = `${environment.apiUrl}/paciente/pagos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de pagos del paciente
   */
  getPagos(params?: {
    page?: number;
    per_page?: number;
    estado?: string;
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<ApiResponse<PagosResponse>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());
      if (params.estado) httpParams = httpParams.set('estado', params.estado);
      if (params.tipo) httpParams = httpParams.set('tipo', params.tipo);
      if (params.fecha_desde) httpParams = httpParams.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) httpParams = httpParams.set('fecha_hasta', params.fecha_hasta);
    }

    return this.http.get<ApiResponse<PagosResponse>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtener detalle de un pago
   */
  getPago(id: string): Observable<ApiResponse<PagoDetallado>> {
    return this.http.get<ApiResponse<PagoDetallado>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo pago para una cita
   */
  crearPago(request: CrearPagoRequest): Observable<ApiResponse<Pago>> {
    return this.http.post<ApiResponse<Pago>>(this.apiUrl, request);
  }

  /**
   * Confirmar un pago pendiente (para efectivo)
   */
  confirmarPago(id: string): Observable<ApiResponse<Pago>> {
    return this.http.put<ApiResponse<Pago>>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  /**
   * Obtener estadísticas de pagos
   */
  getEstadisticas(): Observable<ApiResponse<EstadisticasPagos>> {
    return this.http.get<ApiResponse<EstadisticasPagos>>(`${this.apiUrl}/estadisticas`);
  }

  /**
   * Obtener pagos pendientes
   */
  getPagosPendientes(): Observable<ApiResponse<{ pagos: Pago[]; total: number }>> {
    return this.http.get<ApiResponse<{ pagos: Pago[]; total: number }>>(
      `${this.apiUrl}/pendientes`
    );
  }

  /**
   * Obtener citas con pagos adicionales pendientes
   */
  getCitasConPagosAdicionales(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/adicionales_pendientes`);
  }

  /**
   * Pagar monto adicional de una cita
   */
  pagarAdicional(citaId: string, metodoPago: string): Observable<ApiResponse<Pago>> {
    return this.http.post<ApiResponse<Pago>>(`${this.apiUrl}/adicional`, {
      cita_id: citaId,
      metodo_pago: metodoPago
    });
  }
}
