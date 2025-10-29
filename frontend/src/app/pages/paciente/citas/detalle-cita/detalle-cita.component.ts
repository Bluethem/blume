import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CitasService } from '../../../../services/citas.service';
import { Cita } from '../../../../models';
import { ModalValoracionComponent } from '../components/modal-valoracion/modal-valoracion.component';

interface HistorialCambio {
  accion: string;
  fecha: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-detalle-cita',
  standalone: true,
  imports: [CommonModule, ModalValoracionComponent],
  templateUrl: './detalle-cita.component.html',
  styleUrls: ['./detalle-cita.component.css']
})
export class DetalleCitaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citasService = inject(CitasService);

  cita: Cita | null = null;
  loading = true;
  error: string | null = null;
  
  // Modal valoración
  mostrarModalValoracion = false;

  ngOnInit(): void {
    const citaId = this.route.snapshot.paramMap.get('id');
    if (citaId) {
      this.cargarCita(citaId);
    } else {
      this.error = 'ID de cita no válido';
      this.loading = false;
    }
  }

  cargarCita(id: string): void {
    this.loading = true;
    this.error = null;

    this.citasService.getCita(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cita = response.data;
        } else {
          this.error = 'No se pudo cargar la información de la cita';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar la información de la cita';
        this.loading = false;
      }
    });
  }

  // Acciones
  solicitarCancelacion(): void {
    if (!this.cita) return;

    const motivo = prompt('¿Por qué deseas cancelar esta cita?');
    if (motivo) {
      this.citasService.cancelarCita(this.cita.id, motivo).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Solicitud de cancelación enviada exitosamente');
            this.cargarCita(this.cita!.id);
          }
        },
        error: () => {
          alert('Error al procesar la cancelación');
        }
      });
    }
  }

  descargarResumen(): void {
    if (!this.cita) return;
    // TODO: Implementar descarga de PDF
    alert('Funcionalidad de descarga en desarrollo');
  }

  imprimir(): void {
    window.print();
  }

  verPerfilMedico(): void {
    if (this.cita?.medico?.id) {
      this.router.navigate(['/paciente/medicos', this.cita.medico.id]);
    }
  }

  volver(): void {
    this.router.navigate(['/paciente/citas/mis-citas']);
  }

  // Helpers
  get estadoClase(): string {
    if (!this.cita) return '';
    
    const clases: Record<string, string> = {
      pendiente: 'bg-warning/10 text-warning',
      confirmada: 'bg-secondary/10 text-secondary',
      completada: 'bg-success/10 text-success',
      cancelada: 'bg-primary/10 text-primary',
      no_asistio: 'bg-gray-200 text-gray-600'
    };
    return clases[this.cita.estado] || 'bg-gray-200 text-gray-600';
  }

  get estadoTexto(): string {
    if (!this.cita) return '';
    
    const textos: Record<string, string> = {
      pendiente: 'PENDIENTE',
      confirmada: 'CONFIRMADA',
      completada: 'COMPLETADA',
      cancelada: 'CANCELADA',
      no_asistio: 'NO ASISTIÓ'
    };
    return textos[this.cita.estado] || this.cita.estado.toUpperCase();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    
    return `${dia} de ${mes}, ${anio}`;
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  calcularDuracion(): number {
    if (!this.cita) return 0;
    
    const inicio = new Date(this.cita.fecha_hora_inicio);
    const fin = new Date(this.cita.fecha_hora_fin);
    
    return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60));
  }

  get historialCambios(): HistorialCambio[] {
    if (!this.cita) return [];

    const historial: HistorialCambio[] = [];

    // Agregar cambios según estado
    if (this.cita.estado === 'confirmada' || this.cita.estado === 'completada') {
      historial.push({
        accion: 'Cita Confirmada',
        fecha: this.formatearFechaCompleta(this.cita.updated_at || this.cita.created_at),
        icono: 'check_circle',
        color: 'bg-secondary'
      });
    }

    if (this.cita.estado === 'cancelada') {
      historial.push({
        accion: 'Cita Cancelada',
        fecha: this.formatearFechaCompleta(this.cita.updated_at || this.cita.created_at),
        icono: 'cancel',
        color: 'bg-primary'
      });
    }

    if (this.cita.estado === 'completada') {
      historial.push({
        accion: 'Cita Completada',
        fecha: this.formatearFechaCompleta(this.cita.updated_at || this.cita.created_at),
        icono: 'task_alt',
        color: 'bg-success'
      });
    }

    // Siempre agregar creación
    historial.push({
      accion: 'Cita Creada',
      fecha: this.formatearFechaCompleta(this.cita.created_at),
      icono: 'edit_calendar',
      color: 'bg-warning'
    });

    return historial;
  }

  formatearFechaCompleta(fecha: string): string {
    const date = new Date(fecha);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const anio = date.getFullYear();
    const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `${dia} de ${mes}, ${anio} - ${hora}`;
  }

  get alergiasPaciente(): string[] {
    if (!this.cita?.paciente?.alergias) return [];
    
    // Si es un string, dividir por comas
    if (typeof this.cita.paciente.alergias === 'string') {
      return this.cita.paciente.alergias.split(',').map(a => a.trim()).filter(a => a);
    }
    
    return [];
  }

  puedeCancelar(): boolean {
    if (!this.cita) return false;
    if (this.cita.estado === 'cancelada' || this.cita.estado === 'completada') return false;
    
    const ahora = new Date();
    const inicioCita = new Date(this.cita.fecha_hora_inicio);
    
    // Permitir cancelar hasta 2 horas antes
    const tiempoMinimo = 2 * 60 * 60 * 1000;
    
    return ahora < new Date(inicioCita.getTime() - tiempoMinimo);
  }

  // Valoración
  puedeValorar(): boolean {
    return this.cita?.estado === 'completada';
  }

  abrirModalValoracion(): void {
    this.mostrarModalValoracion = true;
  }

  cerrarModalValoracion(): void {
    this.mostrarModalValoracion = false;
  }

  onValoracionExitosa(): void {
    alert('¡Gracias por tu valoración!');
    this.cerrarModalValoracion();
  }
}