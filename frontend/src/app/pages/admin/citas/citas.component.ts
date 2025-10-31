import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminCitasService, Cita } from '../../../services/admin-citas.service';

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class AdminCitasComponent implements OnInit {
  loading = false;
  citas: Cita[] = [];
  
  // Filtros
  searchTerm = '';
  estadoFiltro = '';
  
  // Selección múltiple
  citasSeleccionadas: Set<string> = new Set();
  todasSeleccionadas = false;
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 20;
  
  // Ordenamiento
  orderBy = 'fecha_hora_inicio';
  orderDir: 'asc' | 'desc' = 'desc';
  
  // Estados
  exportando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private citasService: AdminCitasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCitas();
  }

  loadCitas(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
      order_by: this.orderBy,
      order_dir: this.orderDir
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.estadoFiltro) {
      params.estado = this.estadoFiltro;
    }

    this.citasService.getCitas(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.citas = response.data.citas;
          this.currentPage = response.data.meta.current_page;
          this.totalPages = response.data.meta.total_pages;
          this.totalCount = response.data.meta.total_count;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.mensajeError = 'Error al cargar las citas';
        this.loading = false;
      }
    });
  }

  buscar(): void {
    this.currentPage = 1;
    this.loadCitas();
  }

  cambiarEstadoFiltro(estado: string): void {
    this.estadoFiltro = this.estadoFiltro === estado ? '' : estado;
    this.currentPage = 1;
    this.loadCitas();
  }

  ordenar(campo: string): void {
    if (this.orderBy === campo) {
      this.orderDir = this.orderDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.orderBy = campo;
      this.orderDir = 'asc';
    }
    this.loadCitas();
  }

  toggleSeleccion(citaId: string): void {
    if (this.citasSeleccionadas.has(citaId)) {
      this.citasSeleccionadas.delete(citaId);
    } else {
      this.citasSeleccionadas.add(citaId);
    }
    this.actualizarTodasSeleccionadas();
  }

  toggleTodasSeleccionadas(): void {
    if (this.todasSeleccionadas) {
      this.citasSeleccionadas.clear();
    } else {
      this.citas.forEach(cita => this.citasSeleccionadas.add(cita.id));
    }
    this.todasSeleccionadas = !this.todasSeleccionadas;
  }

  actualizarTodasSeleccionadas(): void {
    this.todasSeleccionadas = this.citas.length > 0 && 
                              this.citas.every(cita => this.citasSeleccionadas.has(cita.id));
  }

  estaSeleccionada(citaId: string): boolean {
    return this.citasSeleccionadas.has(citaId);
  }

  verCita(id: string): void {
    this.router.navigate(['/admin/citas/ver', id]);
  }

  editarCita(id: string): void {
    this.router.navigate(['/admin/citas/editar', id]);
  }

  cancelarCita(cita: Cita): void {
    const motivo = prompt('¿Motivo de la cancelación?');
    if (motivo === null) return;

    this.citasService.cancelarCita(cita.id, motivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Cita cancelada exitosamente';
          this.loadCitas();
        }
      },
      error: (error) => {
        console.error('Error al cancelar:', error);
        this.mensajeError = 'Error al cancelar la cita';
      }
    });
  }

  cancelarSeleccionadas(): void {
    if (this.citasSeleccionadas.size === 0) {
      alert('Selecciona al menos una cita');
      return;
    }

    const motivo = prompt(`¿Motivo para cancelar ${this.citasSeleccionadas.size} citas?`);
    if (motivo === null) return;

    this.citasService.cancelarMultiples(Array.from(this.citasSeleccionadas), motivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = `${this.citasSeleccionadas.size} citas canceladas`;
          this.citasSeleccionadas.clear();
          this.todasSeleccionadas = false;
          this.loadCitas();
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.mensajeError = 'Error al cancelar las citas';
      }
    });
  }

  exportarExcel(): void {
    this.exportando = true;
    
    const params: any = {};
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.estadoFiltro) params.estado = this.estadoFiltro;

    this.citasService.exportar(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Crear y descargar el archivo CSV
          const blob = new Blob([response.data.csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.data.filename || 'citas.csv';
          a.click();
          window.URL.revokeObjectURL(url);
          
          this.mensajeExito = 'Archivo exportado exitosamente';
        }
        this.exportando = false;
      },
      error: (error) => {
        console.error('Error al exportar:', error);
        this.mensajeError = 'Error al exportar las citas';
        this.exportando = false;
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCitas();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCitas();
    }
  }

  getEstadoClase(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'confirmada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'completada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'no_asistio': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }
}
