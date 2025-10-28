import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PacienteDashboardService } from '../../../services/paciente-dashboard.service';
import { DashboardData, Cita, Medico, Notificacion } from '../../../models/dashboard.models';
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-paciente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paciente-dashboard.component.html',
  styleUrls: ['./paciente-dashboard.component.css']
})
export class PacienteDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(PacienteDashboardService);
  private router = inject(Router);

  // Estado de carga
  isLoading = false;
  errorMessage = '';

  // Datos del dashboard
  dashboardData: DashboardData | null = null;
  proximaCita: Cita | null = null;
  medicosDisponibles: Medico[] = [];
  notificaciones: Notificacion[] = [];

  // Usuario actual
  get currentUser() {
    return this.authService.currentUserValue;
  }

  // Fecha actual formateada
  get fechaActual(): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('es-ES', opciones);
  }
  
  get primerNombre(): string {
    return this.dashboardData?.paciente?.nombre_completo?.split(' ')[0] || 'Usuario';
  }

  ngOnInit(): void {
    console.log('🎯 Dashboard ngOnInit ejecutado');
    console.log('Usuario:', this.currentUser);
    console.log('Token:', this.authService.getToken()?.substring(0, 30));
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    console.log('🚀 INICIO cargarDashboard()');
    console.log('isLoading:', this.isLoading);
    
    // Evitar cargar si ya está cargando
    if (this.isLoading) {
      console.warn('⚠️ Ya está cargando, saliendo...');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔍 Cargando dashboard...');
    console.log('Token:', this.authService.getToken()?.substring(0, 20) + '...');
    console.log('API URL completa:', `${environment.apiUrl}/paciente/dashboard`);

    console.log('📡 Llamando a getDashboard()...');
    
    const observable = this.dashboardService.getDashboard();
    console.log('📡 Observable creado:', observable);
    
    observable.subscribe({
      next: (response) => {
        console.log('✅ NEXT - Dashboard cargado:', response);
        if (response.success && response.data) {
          this.dashboardData = response.data;
          this.proximaCita = response.data.proxima_cita;
          this.medicosDisponibles = response.data.medicos_disponibles || [];
          this.notificaciones = response.data.notificaciones_recientes || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ ERROR en subscribe:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        // NO reintentar automáticamente
        if (error.status === 401) {
          this.errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que esté corriendo.';
        } else {
          this.errorMessage = error.message || 'Error al cargar el dashboard.';
        }
        
        this.isLoading = false;
      },
      complete: () => {
        console.log('🏁 COMPLETE - Observable completado');
      }
    });
    
    console.log('📡 Subscribe ejecutado');
  }

  // Métodos de navegación
  navegarACitas(): void {
    this.router.navigate(['/paciente/citas']);
  }

  navegarAMedicos(): void {
    this.router.navigate(['/medicos']);
  }

  navegarANotificaciones(): void {
    this.router.navigate(['/notificaciones']);
  }

  navegarAPerfil(): void {
    this.router.navigate(['/paciente/perfil']);
  }

  // Métodos de acciones
  agendarCita(medicoId: string): void {
    this.router.navigate(['/medicos', medicoId, 'agendar']);
  }

  verDetalleMedico(medicoId: string): void {
    this.router.navigate(['/medicos', medicoId]);
  }

  verDetalleCita(citaId: string): void {
    this.router.navigate(['/paciente/citas', citaId]);
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

  // Métodos helper
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'confirmada': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'completada': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  generarEstrellas(calificacion: number): string[] {
    const estrellas: string[] = [];
    const estrellasCompletas = Math.floor(calificacion);
    const tieneMedia = calificacion % 1 !== 0;

    for (let i = 0; i < estrellasCompletas; i++) {
      estrellas.push('star');
    }

    if (tieneMedia) {
      estrellas.push('star_half');
    }

    while (estrellas.length < 5) {
      estrellas.push('star_outline');
    }

    return estrellas;
  }

}