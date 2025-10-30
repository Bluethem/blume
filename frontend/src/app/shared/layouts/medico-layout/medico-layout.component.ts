import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { ThemeService } from '../../../services/theme.service';
import { Notificacion } from '../../../models';

@Component({
  selector: 'app-medico-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './medico-layout.component.html',
  styleUrls: ['./medico-layout.component.css']
})
export class MedicoLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  public router = inject(Router);
  private notificacionesService = inject(NotificacionesService);
  public themeService = inject(ThemeService);

  currentUser: any = null;
  sidebarOpen = false;
  notificacionesDropdownOpen = false;
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas = 0;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.notificacionesDropdownOpen && !target.closest('.notifications-dropdown')) {
      this.notificacionesDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.notificacionesService.getNotificaciones({ per_page: 5 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificaciones = response.data.notificaciones || [];
          this.notificacionesNoLeidas = response.data.no_leidas || 0;
        }
      },
      error: () => {
        this.notificaciones = [];
        this.notificacionesNoLeidas = 0;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleNotificaciones(event: Event): void {
    event.stopPropagation();
    this.notificacionesDropdownOpen = !this.notificacionesDropdownOpen;
  }

  handleNotificacionClick(notificacion: Notificacion): void {
    if (!notificacion.leida) {
      this.notificacionesService.marcarLeida(notificacion.id).subscribe();
    }
    this.notificacionesDropdownOpen = false;
    
    if (notificacion.cita?.id) {
      this.router.navigate(['/medico/citas/detalle', notificacion.cita.id]);
    }
  }

  marcarTodasLeidas(): void {
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => {
        this.cargarNotificaciones();
      }
    });
  }

  getNotificacionIcono(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'cita_creada': 'event_available',
      'cita_confirmada': 'check_circle',
      'cita_cancelada': 'cancel',
      'recordatorio': 'notifications_active'
    };
    return iconos[tipo] || 'notifications';
  }

  getTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diff = ahora.getTime() - fechaNotif.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos}m`;
    if (horas < 24) return `Hace ${horas}h`;
    return `Hace ${dias}d`;
  }

  navegarANotificaciones(): void {
    this.notificacionesDropdownOpen = false;
    this.router.navigate(['/medico/notificaciones']);
  }

  navegarAPerfil(): void {
    this.router.navigate(['/medico/perfil']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get nombreCompleto(): string {
    return this.currentUser?.nombre_completo || 'Usuario';
  }
}
