import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminCitasService, CitaDetalle } from '../../../services/admin-citas.service';

@Component({
  selector: 'app-ver-cita',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-cita.component.html',
  styleUrls: ['./ver-cita.component.css']
})
export class VerCitaComponent implements OnInit {
  loading = false;
  cita: CitaDetalle | null = null;
  citaId: string = '';
  
  // Estados
  procesando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private citasService: AdminCitasService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.citaId = this.route.snapshot.params['id'];
    if (this.citaId) {
      this.loadCita();
    }
  }

  loadCita(): void {
    this.loading = true;
    this.citasService.getCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cita = response.data as CitaDetalle;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar cita:', error);
        this.mensajeError = 'Error al cargar los detalles de la cita';
        this.loading = false;
      }
    });
  }

  editar(): void {
    this.router.navigate(['/admin/citas/editar', this.citaId]);
  }

  confirmar(): void {
    if (!confirm('¿Confirmar esta cita?')) return;

    this.procesando = true;
    this.citasService.confirmarCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Cita confirmada exitosamente';
          this.loadCita();
        }
        this.procesando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mensajeError = 'Error al confirmar la cita';
        this.procesando = false;
      }
    });
  }

  completar(): void {
    if (!confirm('¿Marcar esta cita como completada?')) return;

    this.procesando = true;
    this.citasService.completarCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Cita marcada como completada';
          this.loadCita();
        }
        this.procesando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mensajeError = 'Error al completar la cita';
        this.procesando = false;
      }
    });
  }

  cancelar(): void {
    const motivo = prompt('¿Motivo de la cancelación?');
    if (motivo === null) return;

    this.procesando = true;
    this.citasService.cancelarCita(this.citaId, motivo).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Cita cancelada exitosamente';
          this.loadCita();
        }
        this.procesando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mensajeError = 'Error al cancelar la cita';
        this.procesando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/citas']);
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
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
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
