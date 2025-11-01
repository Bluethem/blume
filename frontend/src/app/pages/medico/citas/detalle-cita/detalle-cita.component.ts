import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoCitasService } from '../../../../services/medico-citas.service';
import { PdfService } from '../../../../services/pdf.service';
import { CitaMedico } from '../../../../models/medico-citas.models';

@Component({
  selector: 'app-detalle-cita',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-cita.component.html',
  styleUrls: ['./detalle-cita.component.css']
})
export class DetalleCitaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citasService = inject(MedicoCitasService);
  private pdfService = inject(PdfService);

  cita: CitaMedico | null = null;
  loading = false;
  descargandoPdf = false; // ✅ NUEVO
  citaId: string = '';

  ngOnInit(): void {
    this.citaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.citaId) {
      this.cargarDetalle();
    } else {
      this.router.navigate(['/medico/citas']);
    }
  }

  cargarDetalle(): void {
    this.loading = true;
    this.citasService.getCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cita = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/medico/citas']);
      }
    });
  }

  formatearFechaCompleta(fecha: string): string {
    const date = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', opciones);
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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
      'confirmada': 'CONFIRMADA',
      'completada': 'COMPLETADA',
      'pendiente': 'PENDIENTE',
      'cancelada': 'CANCELADA',
      'no_asistio': 'NO ASISTIÓ'
    };
    return labels[estado] || 'PENDIENTE';
  }

  cancelarCita(): void {
    if (!this.cita) return;
    
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      const motivo = prompt('Motivo de cancelación:');
      if (motivo) {
        this.citasService.cancelarCita(this.cita.id, { motivo_cancelacion: motivo }).subscribe({
          next: () => {
            this.cargarDetalle();
          }
        });
      }
    }
  }

  atenderCita(): void {
    if (!this.cita) return;
    this.router.navigate(['/medico/citas/atender', this.cita.id]);
  }

  verPaciente(): void {
    if (this.cita?.paciente?.id) {
      this.router.navigate(['/medico/pacientes', this.cita.paciente.id]);
    }
  }

  descargarResumen(): void {
    // TODO: Implementar descarga de PDF
    alert('Funcionalidad de descarga en desarrollo');
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    this.router.navigate(['/medico/citas']);
  }

  calcularEdad(fechaNacimiento?: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  puedeAtender(): boolean {
    return this.cita?.estado === 'confirmada' || this.cita?.estado === 'pendiente';
  }

  puedeCancelar(): boolean {
    return this.cita?.estado === 'confirmada' || this.cita?.estado === 'pendiente';
  }

  // ✅ NUEVO: Descargar PDF de la cita
  descargarPdf(): void {
    if (!this.citaId || !this.cita) return;

    this.descargandoPdf = true;

    this.pdfService.descargarResumenCitaMedico(this.citaId).subscribe({
      next: (blob) => {
        const fecha = new Date(this.cita!.fecha_hora_inicio);
        const paciente = this.cita!.paciente?.nombre_completo?.replace(/\s+/g, '_') || 'paciente';
        const nombreArchivo = `Consulta_${paciente}_${fecha.toISOString().split('T')[0]}.pdf`;
        
        this.pdfService.descargarArchivo(blob, nombreArchivo);
        this.descargandoPdf = false;
      },
      error: (error) => {
        console.error('Error al descargar PDF:', error);
        alert('Error al generar el PDF. Por favor, intenta nuevamente.');
        this.descargandoPdf = false;
      }
    });
  }
}
