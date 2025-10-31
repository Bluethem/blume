import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminNotificacionesService, NotificacionAdmin } from '../../../services/admin-notificaciones.service';

@Component({
  selector: 'app-admin-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class AdminNotificacionesComponent implements OnInit {
  loading = false;
  notificaciones: NotificacionAdmin[] = [];
  
  // Filtros
  filtroTipo: 'todas' | 'cita_creada' | 'cita_confirmada' | 'cita_cancelada' | 'recordatorio' = 'todas';
  filtroEstado: 'todas' | 'leidas' | 'no_leidas' = 'todas';

  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 20;

  // Math for template
  Math = Math;

  constructor(
    private notificacionesService: AdminNotificacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotificaciones();
  }

  loadNotificaciones(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      per_page: this.perPage
    };

    if (this.filtroTipo !== 'todas') {
      params.tipo = this.filtroTipo;
    }

    if (this.filtroEstado === 'leidas') {
      params.leida = true;
    } else if (this.filtroEstado === 'no_leidas') {
      params.leida = false;
    }

    this.notificacionesService.getNotificaciones(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificaciones = response.data.notificaciones;
          this.currentPage = response.data.meta.current_page;
          this.totalPages = response.data.meta.total_pages;
          this.totalCount = response.data.meta.total_count;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
        this.loading = false;
      }
    });
  }

  cambiarFiltroTipo(tipo: 'todas' | 'cita_creada' | 'cita_confirmada' | 'cita_cancelada' | 'recordatorio'): void {
    this.filtroTipo = tipo;
    this.currentPage = 1;
    this.loadNotificaciones();
  }

  cambiarFiltroEstado(estado: 'todas' | 'leidas' | 'no_leidas'): void {
    this.filtroEstado = estado;
    this.currentPage = 1;
    this.loadNotificaciones();
  }

  marcarComoLeida(notificacion: NotificacionAdmin): void {
    if (notificacion.leida) return;

    this.notificacionesService.marcarComoLeida(notificacion.id).subscribe({
      next: (response) => {
        if (response.success) {
          notificacion.leida = true;
          
          // Si tiene enlace, navegar
          if (notificacion.enlace) {
            this.router.navigateByUrl(notificacion.enlace);
          }
        }
      },
      error: (error) => {
        console.error('Error al marcar como leída:', error);
      }
    });
  }

  marcarTodasLeidas(): void {
    this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: (response) => {
        if (response.success) {
          this.loadNotificaciones();
        }
      },
      error: (error) => {
        console.error('Error al marcar todas como leídas:', error);
      }
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar esta notificación?')) return;

    this.notificacionesService.eliminar(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadNotificaciones();
        }
      },
      error: (error) => {
        console.error('Error al eliminar notificación:', error);
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNotificaciones();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNotificaciones();
    }
  }

  getIcono(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'sistema': 'settings',
      'cita': 'event',
      'usuario': 'person',
      'reporte': 'assessment',
      'alerta': 'warning',
      'info': 'info'
    };
    return iconos[tipo] || 'notifications';
  }

  getColorClase(tipo: string): string {
    const colores: { [key: string]: string } = {
      'sistema': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      'cita': 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
      'usuario': 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
      'reporte': 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
      'alerta': 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
      'info': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    };
    return colores[tipo] || 'bg-gray-100 text-gray-600';
  }

  getTimeAgo(fecha: string): string {
    const now = new Date();
    const date = new Date(fecha);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
