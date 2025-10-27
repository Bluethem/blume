import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
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
export class NotificacionesService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private noLeidasSubject = new BehaviorSubject<number>(0);
  public noLeidas$ = this.noLeidasSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarContadorNoLeidas();
  }

  /**
   * Obtener notificaciones
   */
  getNotificaciones(params?: {
    leidas?: boolean;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl, { params: params as any }).pipe(
      tap(response => {
        if (response.success && response.data.no_leidas !== undefined) {
          this.noLeidasSubject.next(response.data.no_leidas);
        }
      })
    );
  }

  /**
   * Marcar notificación como leída
   */
  marcarLeida(id: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}/marcar_leida`, {}).pipe(
      tap(() => {
        const current = this.noLeidasSubject.value;
        this.noLeidasSubject.next(Math.max(0, current - 1));
      })
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasLeidas(): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/marcar_todas_leidas`, {}).pipe(
      tap(() => {
        this.noLeidasSubject.next(0);
      })
    );
  }

  /**
   * Cargar contador de notificaciones no leídas
   */
  private cargarContadorNoLeidas(): void {
    this.getNotificaciones({ leidas: false, per_page: 1 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.noLeidasSubject.next(response.data.no_leidas || 0);
        }
      },
      error: (error) => {
        console.error('Error al cargar contador de notificaciones:', error);
      }
    });
  }

  /**
   * Obtener número de notificaciones no leídas
   */
  getNoLeidas(): number {
    return this.noLeidasSubject.value;
  }

  /**
   * Refrescar contador de notificaciones
   */
  refrescarContador(): void {
    this.cargarContadorNoLeidas();
  }
}