import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitasService } from '../../../../services/citas.service';
import { Cita } from '../../../../models';

type EstadoCita = 'todas' | 'proximas' | 'completadas' | 'canceladas';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-citas.component.html',
  styleUrl: './mis-citas.component.css'
})
export class MisCitasComponent implements OnInit {
  private citasService = inject(CitasService);
  private router = inject(Router);

  // Estado
  citas: Cita[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filtroActivo: EstadoCita = 'proximas';
  busqueda = '';
  fechaFiltro: string = '';

  // Paginación
  currentPage = 1;
  perPage = 10;
  totalPages = 0;
  totalCitas = 0;

  // Contadores por estado
  contadores = {
    todas: 0,
    proximas: 0,
    completadas: 0,
    canceladas: 0
  };

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarContadores();
  }

  cargarCitas(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      per_page: this.perPage
    };

    // Aplicar filtro de estado
    if (this.filtroActivo !== 'todas') {
      params.estado = this.getEstadoBackend(this.filtroActivo);
    }

    // Aplicar búsqueda
    if (this.busqueda) {
      params.q = this.busqueda;
    }

    // Aplicar filtro de fecha
    if (this.fechaFiltro) {
      params.fecha = this.fechaFiltro;
    }

    this.citasService.getMisCitas(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.citas = response.data;
          
          if (response.meta) {
            this.currentPage = response.meta.page || 1;
            this.perPage = response.meta.per_page || 10;
            this.totalCitas = response.meta.total || 0;
            this.totalPages = response.meta.total_pages || 0;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las citas. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  cargarContadores(): void {
    this.citasService.getContadoresCitas().subscribe({
      next: (response) => {
        if (response.success) {
          this.contadores = response.data;
        }
      },
      error: () => {}
    });
  }

  // Filtros
  cambiarFiltro(filtro: EstadoCita): void {
    this.filtroActivo = filtro;
    this.currentPage = 1;
    this.cargarCitas();
  }

  onBuscar(): void {
    this.currentPage = 1;
    this.cargarCitas();
  }

  onFechaChange(): void {
    this.currentPage = 1;
    this.cargarCitas();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.fechaFiltro = '';
    this.currentPage = 1;
    this.cargarCitas();
  }

  // Acciones de citas
  verDetalle(cita: Cita): void {
    this.router.navigate(['/paciente/citas/detalle', cita.id]);
  }

  cancelarCita(cita: Cita): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      this.citasService.cancelarCita(cita.id, 'Cancelada por el paciente').subscribe({
        next: (response) => {
          if (response.success) {
            alert('Cita cancelada exitosamente');
            this.cargarCitas();
            this.cargarContadores();
          }
        },
        error: () => {
          alert('Error al cancelar la cita');
        }
      });
    }
  }

  unirseVideollamada(cita: Cita): void {
    // TODO: Implementar lógica de videollamada
    alert('Funcionalidad de videollamada en desarrollo');
  }

  volverAgendar(cita: Cita): void {
    // Navegar directamente al formulario de agendar con el médico pre-seleccionado
    if (cita.medico?.id) {
      this.router.navigate(['/paciente/citas/medicos', cita.medico.id, 'agendar']);
    } else {
      // Si por alguna razón no hay médico, ir a la lista de médicos
      this.router.navigate(['/paciente/citas/medicos']);
    }
  }

  nuevaCita(): void {
    this.router.navigate(['/paciente/citas/nueva']);
  }

  // Paginación
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
      this.cargarCitas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Helpers
  getEstadoBackend(estado: EstadoCita): string {
    const map: Record<EstadoCita, string> = {
      todas: '',
      proximas: 'pendiente,confirmada',
      completadas: 'completada',
      canceladas: 'cancelada'
    };
    return map[estado];
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      pendiente: 'bg-state-pending/10 text-state-pending',
      confirmada: 'bg-state-confirmed/10 text-state-confirmed',
      completada: 'bg-state-completed/10 text-state-completed',
      cancelada: 'bg-state-cancelled/10 text-state-cancelled',
      no_asistio: 'bg-gray-200 text-gray-600'
    };
    return clases[estado] || 'bg-gray-200 text-gray-600';
  }

  getEstadoTexto(estado: string): string {
    const textos: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_asistio: 'No Asistió'
    };
    return textos[estado] || estado;
  }

  getIconoEstado(estado: string): string {
    const iconos: Record<string, string> = {
      pendiente: 'schedule',
      confirmada: 'event_available',
      completada: 'task_alt',
      cancelada: 'close',
      no_asistio: 'event_busy'
    };
    return iconos[estado] || 'circle';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const diaSemana = dias[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `${diaSemana}, ${dia} de ${mes} de ${anio} - ${hora}`;
  }

  puedeUnirseVideollamada(cita: Cita): boolean {
    if (cita.estado !== 'confirmada') return false;
    
    const ahora = new Date();
    const inicioCita = new Date(cita.fecha_hora_inicio);
    const finCita = new Date(cita.fecha_hora_fin);
    
    // Permitir unirse 10 minutos antes hasta el final de la cita
    const tiempoAntes = 10 * 60 * 1000; // 10 minutos en ms
    
    return ahora >= new Date(inicioCita.getTime() - tiempoAntes) && ahora <= finCita;
  }

  puedeCancelar(cita: Cita): boolean {
    if (cita.estado === 'cancelada' || cita.estado === 'completada') return false;
    
    const ahora = new Date();
    const inicioCita = new Date(cita.fecha_hora_inicio);
    
    // Permitir cancelar hasta 2 horas antes
    const tiempoMinimo = 2 * 60 * 60 * 1000; // 2 horas en ms
    
    return ahora < new Date(inicioCita.getTime() - tiempoMinimo);
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.currentPage - 1);
    const fin = Math.min(this.totalPages, this.currentPage + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }
}