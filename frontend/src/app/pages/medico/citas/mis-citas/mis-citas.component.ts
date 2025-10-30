import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicoCitasService } from '../../../../services/medico-citas.service';
import { CitaMedico, EstadoCita, FiltrosCitas } from '../../../../models/medico-citas.models';

type FiltroEstado = 'todas' | 'proximas' | 'completadas' | 'canceladas';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.css']
})
export class MisCitasComponent implements OnInit {
  private citasService = inject(MedicoCitasService);
  private router = inject(Router);

  citas: CitaMedico[] = [];
  loading = false;
  
  // Filtros
  filtroActivo: FiltroEstado = 'proximas';
  busqueda = '';
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  perPage = 10;
  
  // Estadísticas para tabs
  estadisticas = {
    todas: 0,
    proximas: 0,
    completadas: 0,
    canceladas: 0
  };

  ngOnInit(): void {
    this.cargarCitas();
  }

  cargarCitas(): void {
    this.loading = true;
    
    const filtros: FiltrosCitas = {
      estado: this.filtroActivo,
      busqueda: this.busqueda || undefined,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.citasService.getMisCitas(filtros).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.citas = response.data.citas || [];
          this.totalPages = response.data.total_pages || 1;
          
          if (response.data.estadisticas) {
            this.estadisticas = response.data.estadisticas;
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cambiarFiltro(filtro: FiltroEstado): void {
    this.filtroActivo = filtro;
    this.currentPage = 1;
    this.cargarCitas();
  }

  buscar(): void {
    this.currentPage = 1;
    this.cargarCitas();
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cargarCitas();
    }
  }

  formatearFechaHora(fecha: string): { fecha: string; hora: string } {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const fechaFormateada = date.toLocaleDateString('es-ES', opciones);
    const horaFormateada = date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return {
      fecha: fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1),
      hora: horaFormateada
    };
  }

  getEstadoBadgeClass(estado: EstadoCita): string {
    const clases: { [key: string]: string } = {
      'confirmada': 'bg-state-confirmed/10 text-state-confirmed',
      'completada': 'bg-state-completed/10 text-state-completed',
      'pendiente': 'bg-state-pending/10 text-state-pending',
      'cancelada': 'bg-state-cancelled/10 text-state-cancelled',
      'no_asistio': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    return clases[estado] || clases['pendiente'];
  }

  getEstadoLabel(estado: EstadoCita): string {
    const labels: { [key: string]: string } = {
      'confirmada': 'Confirmada',
      'completada': 'Completada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'no_asistio': 'No Asistió'
    };
    return labels[estado] || 'Pendiente';
  }

  getEstadoIconClass(estado: EstadoCita): string {
    const clases: { [key: string]: string } = {
      'confirmada': 'bg-state-confirmed',
      'completada': 'bg-state-completed',
      'pendiente': 'bg-state-pending',
      'cancelada': 'bg-state-cancelled',
      'no_asistio': 'bg-gray-400'
    };
    return clases[estado] || clases['pendiente'];
  }

  getEstadoIcon(estado: EstadoCita): string {
    const iconos: { [key: string]: string } = {
      'confirmada': 'check',
      'completada': 'task_alt',
      'pendiente': 'schedule',
      'cancelada': 'close',
      'no_asistio': 'person_off'
    };
    return iconos[estado] || 'schedule';
  }

  verDetalle(citaId: string): void {
    this.router.navigate(['/medico/citas/detalle', citaId]);
  }

  atenderCita(citaId: string): void {
    this.router.navigate(['/medico/citas/atender', citaId]);
  }

  cancelarCita(citaId: string): void {
    // TODO: Mostrar modal de confirmación
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      const motivo = prompt('Motivo de cancelación:');
      if (motivo) {
        this.citasService.cancelarCita(citaId, { motivo_cancelacion: motivo }).subscribe({
          next: () => {
            this.cargarCitas();
          }
        });
      }
    }
  }

  agendarNuevaCita(): void {
    this.router.navigate(['/medico/citas/agendar']);
  }

  verDiagnostico(citaId: string): void {
    this.router.navigate(['/medico/citas/detalle', citaId]);
  }

  getPaginaNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(this.totalPages, 3); i++) {
      pages.push(i);
    }
    return pages;
  }
}
