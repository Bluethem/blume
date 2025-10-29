import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Notificacion } from '../../../models';

type FiltroNotificaciones = 'todas' | 'no_leidas' | 'leidas';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {
  private notificacionesService = inject(NotificacionesService);
  private router = inject(Router);

  notificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  loading = false;
  filtroActivo: FiltroNotificaciones = 'todas';

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.loading = true;
    this.notificacionesService.getNotificaciones().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // El backend devuelve { notificaciones: [...], total: X, no_leidas: Y }
          this.notificaciones = response.data.notificaciones || [];
          this.aplicarFiltro();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando notificaciones:', error);
        this.notificaciones = [];
        this.loading = false;
      }
    });
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

  cambiarFiltro(filtro: FiltroNotificaciones): void {
    this.filtroActivo = filtro;
    this.aplicarFiltro();
  }

  marcarComoLeida(notificacion: Notificacion): void {
    if (notificacion.leida) return;

    this.notificacionesService.marcarLeida(notificacion.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          notificacion.leida = true;
          this.aplicarFiltro();
        }
      },
      error: (error: any) => console.error('Error marcando como leída:', error)
    });
  }

  marcarComoNoLeida(notificacion: Notificacion): void {
    if (!notificacion.leida) return;

    this.notificacionesService.marcarNoLeida(notificacion.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          notificacion.leida = false;
          this.aplicarFiltro();
        }
      },
      error: (error: any) => console.error('Error marcando como no leída:', error)
    });
  }

  marcarTodasComoLeidas(): void {
    const noLeidas = this.notificaciones.filter(n => !n.leida);
    if (noLeidas.length === 0) return;

    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificaciones.forEach(n => n.leida = true);
          this.aplicarFiltro();
        }
      },
      error: (error: any) => console.error('Error marcando todas como leídas:', error)
    });
  }

  eliminarNotificacion(notificacion: Notificacion): void {
    if (!confirm('¿Estás seguro de eliminar esta notificación?')) return;

    this.notificacionesService.eliminarNotificacion(notificacion.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificaciones = this.notificaciones.filter(n => n.id !== notificacion.id);
          this.aplicarFiltro();
        }
      },
      error: (error: any) => console.error('Error eliminando notificación:', error)
    });
  }

  verCita(notificacion: Notificacion): void {
    if (notificacion.cita_id) {
      this.marcarComoLeida(notificacion);
      this.router.navigate(['/paciente/citas/detalle', notificacion.cita_id]);
    }
  }

  getIcono(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'cita_creada': 'calendar_add_on',
      'cita_confirmada': 'task_alt',
      'cita_cancelada': 'cancel',
      'recordatorio': 'notifications_active',
      'cita_completada': 'check_circle',
      'mensaje': 'chat',
      'default': 'notifications'
    };
    return iconos[tipo] || iconos['default'];
  }

  get notificacionesNoLeidas(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  get hayNotificaciones(): boolean {
    return this.notificacionesFiltradas.length > 0;
  }
}
