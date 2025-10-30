import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MedicoDashboardService } from '../../../services/medico-dashboard.service';
import { MedicoDashboardData, CitaMedico, PacienteReciente } from '../../../models/medico-dashboard.models';

@Component({
  selector: 'app-medico-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medico-dashboard.component.html',
  styleUrls: ['./medico-dashboard.component.css']
})
export class MedicoDashboardComponent implements OnInit {
  private dashboardService = inject(MedicoDashboardService);
  private router = inject(Router);

  dashboardData: MedicoDashboardData | null = null;
  loading = false;
  fechaActual = '';

  // Calendario semanal
  semanaActual: Date = new Date();
  diasSemana: DiaSemana[] = [];
  citasPorDia: Map<string, CitaMedico[]> = new Map();

  ngOnInit(): void {
    this.cargarDashboard();
    this.establecerFechaActual();
    this.inicializarSemana();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData = response.data;
          // Re-inicializar calendario con las citas cargadas
          this.agruparCitasPorDia();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  establecerFechaActual(): void {
    const fecha = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    this.fechaActual = fecha.toLocaleDateString('es-ES', opciones);
    // Capitalizar primera letra
    this.fechaActual = this.fechaActual.charAt(0).toUpperCase() + this.fechaActual.slice(1);
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'confirmada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'completada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'no_asistio': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return clases[estado] || clases['pendiente'];
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'completada': 'Completada',
      'pendiente': 'En Espera',
      'cancelada': 'Cancelada',
      'no_asistio': 'No Asistió'
    };
    return labels[estado] || 'Pendiente';
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  verDetalleCita(citaId: string): void {
    this.router.navigate(['/medico/citas/detalle', citaId]);
  }

  verPaciente(pacienteId: string): void {
    this.router.navigate(['/medico/pacientes', pacienteId]);
  }

  navegarACitas(): void {
    this.router.navigate(['/medico/citas']);
  }

  navegarAPacientes(): void {
    this.router.navigate(['/medico/pacientes']);
  }

  navegarAHorarios(): void {
    this.router.navigate(['/medico/horarios']);
  }

  navegarAEstadisticas(): void {
    this.router.navigate(['/medico/estadisticas']);
  }

  // ========== CALENDARIO SEMANAL ==========

  inicializarSemana(): void {
    this.generarDiasSemana();
    this.agruparCitasPorDia();
  }

  generarDiasSemana(): void {
    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const inicioSemana = this.obtenerInicioSemana(this.semanaActual);
    
    this.diasSemana = [];
    for (let i = 1; i <= 7; i++) { // Lunes a Domingo
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      
      this.diasSemana.push({
        fecha: new Date(dia),
        numero: dia.getDate(),
        nombre: diasNombres[dia.getDay()],
        nombreCorto: diasNombres[dia.getDay()].substring(0, 2).toUpperCase(),
        esHoy: this.esHoy(dia),
        mes: dia.toLocaleDateString('es-ES', { month: 'short' })
      });
    }
  }

  obtenerInicioSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana; // Ajustar para que lunes sea el inicio
    dia.setDate(dia.getDate() + diff);
    dia.setHours(0, 0, 0, 0);
    return dia;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  agruparCitasPorDia(): void {
    this.citasPorDia.clear();
    
    if (!this.dashboardData?.citas_proximas) return;

    this.diasSemana.forEach(dia => {
      const clave = this.obtenerClaveFecha(dia.fecha);
      this.citasPorDia.set(clave, []);
    });

    this.dashboardData.citas_proximas.forEach(cita => {
      const fechaCita = new Date(cita.fecha_hora_inicio);
      const clave = this.obtenerClaveFecha(fechaCita);
      
      if (this.citasPorDia.has(clave)) {
        this.citasPorDia.get(clave)?.push(cita);
      }
    });
  }

  obtenerClaveFecha(fecha: Date): string {
    return fecha.toISOString().split('T')[0];
  }

  getCitasDia(dia: DiaSemana): CitaMedico[] {
    const clave = this.obtenerClaveFecha(dia.fecha);
    return this.citasPorDia.get(clave) || [];
  }

  semanaAnterior(): void {
    this.semanaActual.setDate(this.semanaActual.getDate() - 7);
    this.semanaActual = new Date(this.semanaActual);
    this.inicializarSemana();
  }

  semanaSiguiente(): void {
    this.semanaActual.setDate(this.semanaActual.getDate() + 7);
    this.semanaActual = new Date(this.semanaActual);
    this.inicializarSemana();
  }

  get tituloSemana(): string {
    if (this.diasSemana.length === 0) return 'Semana Actual';
    
    const primerDia = this.diasSemana[0].fecha;
    const ultimoDia = this.diasSemana[6].fecha;
    
    const esEstaSemana = this.diasSemana.some(d => d.esHoy);
    if (esEstaSemana) return 'Semana Actual';
    
    const mesInicio = primerDia.toLocaleDateString('es-ES', { month: 'short' });
    const mesFin = ultimoDia.toLocaleDateString('es-ES', { month: 'short' });
    
    if (mesInicio === mesFin) {
      return `${primerDia.getDate()} - ${ultimoDia.getDate()} ${mesFin}`;
    }
    
    return `${primerDia.getDate()} ${mesInicio} - ${ultimoDia.getDate()} ${mesFin}`;
  }
}

interface DiaSemana {
  fecha: Date;
  numero: number;
  nombre: string;
  nombreCorto: string;
  esHoy: boolean;
  mes: string;
}
