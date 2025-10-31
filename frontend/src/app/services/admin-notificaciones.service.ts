import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificacionAdmin {
  id: string;
  tipo: string;
  tipo_display: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  enlace?: string;
  datos_adicionales?: any;
  created_at: string;
}

export interface NotificacionesResponse {
  success: boolean;
  data?: {
    notificaciones: NotificacionAdmin[];
    no_leidas: number;
    meta: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
  message?: string;
  errors?: string[];
}

export interface NotificacionResponse {
  success: boolean;
  data?: NotificacionAdmin;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificacionesService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  constructor(private http: HttpClient) {}

  getNotificaciones(params?: {
    page?: number;
    per_page?: number;
    tipo?: string;
    leida?: boolean;
  }): Observable<NotificacionesResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }
    if (params?.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }
    if (params?.leida !== undefined) {
      httpParams = httpParams.set('leida', params.leida.toString());
    }

    return this.http.get<NotificacionesResponse>(this.apiUrl, { params: httpParams });
  }

  getNoLeidas(): Observable<NotificacionesResponse> {
    return this.getNotificaciones({ leida: false, per_page: 10 });
  }

  marcarComoLeida(id: string): Observable<NotificacionResponse> {
    return this.http.put<NotificacionResponse>(`${this.apiUrl}/${id}/marcar_leida`, {});
  }

  marcarTodasComoLeidas(): Observable<NotificacionResponse> {
    return this.http.put<NotificacionResponse>(`${this.apiUrl}/marcar_todas_leidas`, {});
  }

  eliminar(id: string): Observable<NotificacionResponse> {
    return this.http.delete<NotificacionResponse>(`${this.apiUrl}/${id}`);
  }
}
