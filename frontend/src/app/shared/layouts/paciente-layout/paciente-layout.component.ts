import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { ThemeService } from '../../../services/theme.service';
import { Usuario, Notificacion } from '../../../models';
import { ChatbotComponent } from '../../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-paciente-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule, ChatbotComponent],
  templateUrl: './paciente-layout.component.html',
  styleUrls: ['./paciente-layout.component.css']
})
export class PacienteLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificacionesService = inject(NotificacionesService);
  public themeService = inject(ThemeService);

  currentUser: Usuario | null = null;
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas = 0;
  sidebarOpen = false;
  searchQuery = '';
  notificacionesDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.relative');
    
    if (!clickedInside && this.notificacionesDropdownOpen) {
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
          // El backend devuelve { notificaciones: [...], total: X, no_leidas: Y }
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

  buscar(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/paciente/citas/medicos'], { 
        queryParams: { q: this.searchQuery.trim() } 
      });
    }
  }

  toggleNotificaciones(): void {
    this.notificacionesDropdownOpen = !this.notificacionesDropdownOpen;
  }

  handleNotificacionClick(notif: Notificacion): void {
    // Marcar como leída si no lo está
    if (!notif.leida) {
      this.notificacionesService.marcarLeida(notif.id).subscribe({
        next: () => {
          notif.leida = true;
          this.notificacionesNoLeidas = Math.max(0, this.notificacionesNoLeidas - 1);
        }
      });
    }
    
    // Cerrar dropdown
    this.notificacionesDropdownOpen = false;
    
    // Navegar si tiene cita asociada
    if (notif.cita_id) {
      this.router.navigate(['/paciente/citas/detalle', notif.cita_id]);
    }
  }

  marcarTodasLeidas(): void {
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        this.notificacionesNoLeidas = 0;
      }
    });
  }

  getNotificacionIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'cita_creada': 'event_available',
      'cita_confirmada': 'check_circle',
      'cita_cancelada': 'cancel',
      'recordatorio': 'alarm'
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
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return fechaNotif.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  navegarANotificaciones(): void {
    this.notificacionesDropdownOpen = false;
    this.router.navigate(['/paciente/notificaciones']);
  }

  navegarAPerfil(): void {
    this.router.navigate(['/paciente/mi-perfil']);
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }

  get nombreCompleto(): string {
    return this.currentUser?.nombre_completo || 'Usuario';
  }
}
