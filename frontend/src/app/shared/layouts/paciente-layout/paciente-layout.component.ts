import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { NotificacionesService } from '../../../services/notificaciones.service';
import { Usuario, Notificacion } from '../../../models';

@Component({
  selector: 'app-paciente-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './paciente-layout.component.html',
  styleUrls: ['./paciente-layout.component.css']
})
export class PacienteLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificacionesService = inject(NotificacionesService);

  currentUser: Usuario | null = null;
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas = 0;
  sidebarOpen = false;
  searchQuery = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.notificacionesService.getNotificaciones().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificaciones = response.data;
          this.notificacionesNoLeidas = this.notificaciones.filter(n => !n.leida).length;
        }
      },
      error: () => {}
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

  navegarANotificaciones(): void {
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
