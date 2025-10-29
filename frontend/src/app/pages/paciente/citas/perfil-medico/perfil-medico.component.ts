import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Medico } from '../../../../services/medicos.service';
import { MedicosService } from '../../../../services/medicos.service';
import { ValoracionesService } from '../../../../services/valoraciones.service';
import { Valoracion, EstadisticasValoraciones } from '../../../../models';

interface Certificacion {
  nombre: string;
  institucion: string;
}

interface Resena {
  nombre_paciente: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

@Component({
  selector: 'app-perfil-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-medico.component.html',
  styleUrl: './perfil-medico.component.css'
})
export class PerfilMedicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private medicosService = inject(MedicosService);
  private valoracionesService = inject(ValoracionesService);

  medico: Medico | null = null;
  loading = true;
  error: string | null = null;
  
  // Valoraciones
  valoraciones: Valoracion[] = [];
  estadisticas: EstadisticasValoraciones | null = null;
  loadingValoraciones = false;

  // Tabs
  tabActiva: 'informacion' | 'horarios' | 'resenas' = 'informacion';

  // Formulario de cita rápida
  citaForm = {
    fecha: '',
    hora: ''
  };

  // Horarios de ejemplo (esto vendrá del backend)
  horariosDisponibles = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  ngOnInit(): void {
    const medicoId = this.route.snapshot.paramMap.get('id');
    if (medicoId) {
      this.cargarMedico(medicoId);
      this.cargarValoraciones(medicoId);
      this.cargarEstadisticas(medicoId);
    } else {
      this.error = 'ID de médico no válido';
      this.loading = false;
    }
  }

  cargarMedico(id: string): void {
    this.loading = true;
    this.error = null;

    this.medicosService.getMedico(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.medico = response.data;
        } else {
          this.error = 'No se pudo cargar la información del médico';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la información del médico';
        this.loading = false;
      }
    });
  }

  cambiarTab(tab: 'informacion' | 'horarios' | 'resenas'): void {
    this.tabActiva = tab;
  }

  agendarCita(): void {
    if (this.medico) {
      this.router.navigate(['/paciente/citas/nueva'], {
        queryParams: { medico_id: this.medico.id }
      });
    }
  }

  confirmarCitaRapida(): void {
    if (!this.citaForm.fecha || !this.citaForm.hora) {
      alert('Por favor, seleccione fecha y hora');
      return;
    }

    this.router.navigate(['/paciente/citas/nueva'], {
      queryParams: {
        medico_id: this.medico?.id,
        fecha: this.citaForm.fecha,
        hora: this.citaForm.hora
      }
    });
  }

  volver(): void {
    this.router.navigate(['/paciente/medicos']);
  }

  // Helpers
  get estrellas(): number[] {
    const calificacion = this.medico?.calificacion || 0;
    return Array(5).fill(0).map((_, i) => i < Math.floor(calificacion) ? 1 : 0);
  }

  get tieneMediaEstrella(): boolean {
    const calificacion = this.medico?.calificacion || 0;
    return calificacion % 1 >= 0.5;
  }

  get certificacionesFormateadas(): Certificacion[] {
    // Por ahora retornamos datos de ejemplo
    // TODO: Implementar cuando el backend tenga las certificaciones
    return [
      {
        nombre: 'Especialista en Cardiología Intervencionista',
        institucion: 'Universidad Nacional'
      },
      {
        nombre: 'Miembro de la Sociedad de Cardiología',
        institucion: 'Sociedad Peruana de Cardiología'
      }
    ];
  }

  cargarValoraciones(medicoId: string): void {
    this.loadingValoraciones = true;
    this.valoracionesService.getValoracionesMedico(medicoId, { per_page: 10 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.valoraciones = response.data;
        }
        this.loadingValoraciones = false;
      },
      error: () => {
        this.loadingValoraciones = false;
      }
    });
  }

  cargarEstadisticas(medicoId: string): void {
    this.valoracionesService.getEstadisticas(medicoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticas = response.data;
        }
      },
      error: () => {}
    });
  }

  get resenasFormateadas(): Resena[] {
    return this.valoraciones.map(v => ({
      nombre_paciente: v.nombre_paciente,
      calificacion: v.calificacion,
      comentario: v.comentario || '',
      fecha: this.formatearFechaRelativa(v.created_at)
    }));
  }

  formatearFechaRelativa(fecha: string): string {
    const ahora = new Date();
    const fechaValoracion = new Date(fecha);
    const diff = ahora.getTime() - fechaValoracion.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
  }

  estrellasPorCalificacion(calificacion: number): { llenas: number; vacia: boolean } {
    return {
      llenas: Math.floor(calificacion),
      vacia: calificacion < 5
    };
  }
}