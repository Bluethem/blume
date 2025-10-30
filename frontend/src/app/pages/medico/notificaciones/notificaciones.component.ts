import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  cita_id?: string;
  icono: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  notificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  loading = false;
  filtroActivo: 'todas' | 'no_leidas' | 'leidas' = 'todas';

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.loading = true;
    this.http.get<ApiResponse<Notificacion[]>>(`${this.apiUrl}/medico/notificaciones`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificaciones = response.data;
          this.aplicarFiltro();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cambiarFiltro(filtro: 'todas' | 'no_leidas' | 'leidas'): void {
    this.filtroActivo = filtro;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    switch (this.filtroActivo) {
      case 'no_leidas':
        this.notificacionesFiltradas = this.notificaciones.filter(n => !n.leida);
        break;
      case 'leidas':
        this.notificacionesFiltradas = this.notificaciones.filter(n => n.leida);
        break;
      default:
        this.notificacionesFiltradas = [...this.notificaciones];
    }
  }

  marcarTodasComoLeidas(): void {
    this.http.post<ApiResponse<any>>(`${this.apiUrl}/medico/notificaciones/marcar_todas_leidas`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificaciones.forEach(n => n.leida = true);
          this.aplicarFiltro();
        }
      }
    });
  }

  marcarComoLeida(notificacionId: string): void {
    this.http.put<ApiResponse<any>>(`${this.apiUrl}/medico/notificaciones/${notificacionId}/marcar_leida`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          const notif = this.notificaciones.find(n => n.id === notificacionId);
          if (notif) {
            notif.leida = true;
            this.aplicarFiltro();
          }
        }
      }
    });
  }

  marcarComoNoLeida(notificacionId: string): void {
    this.http.put<ApiResponse<any>>(`${this.apiUrl}/medico/notificaciones/${notificacionId}/marcar_no_leida`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          const notif = this.notificaciones.find(n => n.id === notificacionId);
          if (notif) {
            notif.leida = false;
            this.aplicarFiltro();
          }
        }
      }
    });
  }

  eliminarNotificacion(notificacionId: string): void {
    if (!confirm('¿Estás seguro de eliminar esta notificación?')) {
      return;
    }

    this.http.delete<ApiResponse<any>>(`${this.apiUrl}/medico/notificaciones/${notificacionId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId);
          this.aplicarFiltro();
        }
      }
    });
  }

  verCita(notificacion: Notificacion): void {
    if (notificacion.cita_id) {
      // Marcar como leída
      if (!notificacion.leida) {
        this.marcarComoLeida(notificacion.id);
      }
      // Navegar a la cita
      this.router.navigate(['/medico/citas/detalle', notificacion.cita_id]);
    }
  }

  obtenerTiempoTranscurrido(fecha: string): string {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = ahora.getTime() - fechaNotif.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    if (horas < 24) return `hace ${horas}h`;
    if (dias === 1) return 'hace 1 día';
    return `hace ${dias} días`;
  }

  get totalNoLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  get hayNotificaciones(): boolean {
    return this.notificacionesFiltradas.length > 0;
  }
}
