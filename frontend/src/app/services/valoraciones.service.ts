import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  ApiResponse, 
  Valoracion, 
  CreateValoracionRequest,
  EstadisticasValoraciones 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ValoracionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medicos`;

  /**
   * Obtener valoraciones de un médico
   */
  getValoracionesMedico(medicoId: string, params?: { page?: number; per_page?: number }): Observable<ApiResponse<Valoracion[]>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.per_page) httpParams = httpParams.set('per_page', params.per_page.toString());

    return this.http.get<ApiResponse<Valoracion[]>>(
      `${this.apiUrl}/${medicoId}/valoraciones`,
      { params: httpParams }
    );
  }

  /**
   * Crear una nueva valoración
   */
  crearValoracion(medicoId: string, request: CreateValoracionRequest): Observable<ApiResponse<Valoracion>> {
    return this.http.post<ApiResponse<Valoracion>>(
      `${this.apiUrl}/${medicoId}/valoraciones`,
      request
    );
  }

  /**
   * Actualizar una valoración existente
   */
  actualizarValoracion(valoracionId: string, request: CreateValoracionRequest): Observable<ApiResponse<Valoracion>> {
    return this.http.put<ApiResponse<Valoracion>>(
      `${environment.apiUrl}/valoraciones/${valoracionId}`,
      request
    );
  }

  /**
   * Eliminar una valoración
   */
  eliminarValoracion(valoracionId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${environment.apiUrl}/valoraciones/${valoracionId}`
    );
  }

  /**
   * Obtener estadísticas de valoraciones de un médico
   */
  getEstadisticas(medicoId: string): Observable<ApiResponse<EstadisticasValoraciones>> {
    return this.http.get<ApiResponse<EstadisticasValoraciones>>(
      `${this.apiUrl}/${medicoId}/estadisticas_valoraciones`
    );
  }

  /**
   * Obtener una valoración específica
   */
  getValoracion(valoracionId: string): Observable<ApiResponse<Valoracion>> {
    return this.http.get<ApiResponse<Valoracion>>(
      `${environment.apiUrl}/valoraciones/${valoracionId}`
    );
  }
}
