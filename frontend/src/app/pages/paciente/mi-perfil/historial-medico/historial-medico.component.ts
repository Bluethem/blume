import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CitasService } from '../../../../services/citas.service';
import { PdfService } from '../../../../services/pdf.service';

type FiltroFecha = 'todos' | '6meses' | '1ano' | 'personalizado';

interface CitaHistorial {
  id: string;
  fecha: string;
  medico: {
    nombre: string;
    especialidad: string;
  };
  diagnostico: string;
}

@Component({
  selector: 'app-historial-medico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-medico.component.html',
  styleUrls: ['./historial-medico.component.css']
})
export class HistorialMedicoComponent implements OnInit {
  private router = inject(Router);
  private citasService = inject(CitasService);
  private pdfService = inject(PdfService);

  citasCompletadas: any[] = [];
  citasFiltradas: any[] = [];
  loading = false;
  descargandoPdf = false; // ✅ NUEVO: Estado de descarga de PDF
  filtroActivo: FiltroFecha = 'todos';

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loading = true;
    this.citasService.getMisCitas({ estado: 'completada' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.citasCompletadas = Array.isArray(response.data) ? response.data : [];
          this.aplicarFiltro();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  aplicarFiltro(): void {
    const ahora = new Date();
    
    switch (this.filtroActivo) {
      case '6meses':
        const seismeses = new Date();
        seismeses.setMonth(ahora.getMonth() - 6);
        this.citasFiltradas = this.citasCompletadas.filter(cita => 
          new Date(cita.fecha_hora_inicio) >= seismeses
        );
        break;
      case '1ano':
        const unano = new Date();
        unano.setFullYear(ahora.getFullYear() - 1);
        this.citasFiltradas = this.citasCompletadas.filter(cita => 
          new Date(cita.fecha_hora_inicio) >= unano
        );
        break;
      default:
        this.citasFiltradas = [...this.citasCompletadas];
    }
  }

  cambiarFiltro(filtro: FiltroFecha): void {
    this.filtroActivo = filtro;
    this.aplicarFiltro();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  verDetalleCita(citaId: string): void {
    this.router.navigate(['/paciente/citas/detalle', citaId]);
  }

  descargarResumen(): void {
    this.descargandoPdf = true;

    this.pdfService.descargarHistorialMedico().subscribe({
      next: (blob) => {
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Historial_Medico_${fecha}.pdf`;
        
        this.pdfService.descargarArchivo(blob, nombreArchivo);
        this.descargandoPdf = false;
      },
      error: (error) => {
        console.error('Error al descargar historial médico:', error);
        alert('Error al generar el PDF del historial. Por favor, intenta nuevamente.');
        this.descargandoPdf = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/paciente/mi-perfil']);
  }
}
