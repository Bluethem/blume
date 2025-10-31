import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AdminNotificacionesService, NotificacionAdmin } from '../../../services/admin-notificaciones.service';
import { ChatbotComponent } from '../../../components/chatbot/chatbot.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatbotComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = true;
  userMenuOpen = false;
  notificationsOpen = false;
  isDarkMode = false;
  
  // Notificaciones reales del servicio
  notifications: NotificacionAdmin[] = [];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificacionesService: AdminNotificacionesService
  ) {}
  
  ngOnInit(): void {
    // Cargar preferencia de dark mode desde localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedDarkMode === 'true';
    this.applyDarkMode();
    
    // Cargar notificaciones no leídas
    this.loadNotificaciones();
  }
  
  loadNotificaciones(): void {
    // Cargar solo las últimas 10 notificaciones para el dropdown
    this.notificacionesService.getNotificaciones({ page: 1, per_page: 10 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications = response.data.notificaciones;
        }
      },
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Cerrar user menu si el clic es fuera del dropdown
    const userMenuButton = target.closest('[data-user-menu-button]');
    const userMenuDropdown = target.closest('[data-user-menu-dropdown]');
    if (!userMenuButton && !userMenuDropdown && this.userMenuOpen) {
      this.userMenuOpen = false;
    }
    
    // Cerrar notificaciones si el clic es fuera del dropdown
    const notifButton = target.closest('[data-notif-button]');
    const notifDropdown = target.closest('[data-notif-dropdown]');
    if (!notifButton && !notifDropdown && this.notificationsOpen) {
      this.notificationsOpen = false;
    }
  }
  
  get currentUser() {
    return this.authService.currentUserValue;
  }
  
  get isSuperAdmin(): boolean {
    const user = this.currentUser;
    console.log('Checking super admin:', { user, es_super_admin: user?.es_super_admin });
    return user?.es_super_admin === true;
  }
  
  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.leida).length;
  }
  
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
  
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      this.notificationsOpen = false;
    }
  }
  
  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.userMenuOpen = false;
    }
  }
  
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.applyDarkMode();
  }
  
  private applyDarkMode(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  markAsRead(notificationId: string): void {
    this.notificacionesService.marcarComoLeida(notificationId).subscribe({
      next: (response) => {
        if (response.success) {
          const notification = this.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.leida = true;
          }
        }
      },
      error: (error) => {
        console.error('Error al marcar notificación:', error);
      }
    });
  }

  onNotificationClick(notification: any): void {
    // Marcar como leída
    if (!notification.leida) {
      this.markAsRead(notification.id);
    }

    // Cerrar dropdown
    this.notificationsOpen = false;

    // Navegar si tiene enlace o si es una notificación de cita
    if (notification.enlace) {
      this.router.navigate([notification.enlace]);
    } else if (notification.datos_adicionales?.cita_id) {
      // Navegar a la página de citas con filtro o detalle
      this.router.navigate(['/admin/citas'], { 
        queryParams: { id: notification.datos_adicionales.cita_id } 
      });
    } else if (notification.tipo.includes('cita')) {
      // Si es una notificación de cita pero no tiene ID específico, ir a la lista de citas
      this.router.navigate(['/admin/citas']);
    }
  }
  
  markAllAsRead(): void {
    this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(n => n.leida = true);
        }
      },
      error: (error) => {
        console.error('Error al marcar todas:', error);
      }
    });
  }
  
  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'cita_creada': return 'event_available';
      case 'cita_cancelada': return 'event_busy';
      case 'cita_confirmada': return 'check_circle';
      case 'recordatorio': return 'notifications_active';
      default: return 'notifications';
    }
  }
  
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
