import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicosService } from '../../../../services/medicos.service';
import { ValoracionesService } from '../../../../services/valoraciones.service';
import { Medico, Valoracion, EstadisticasValoraciones } from '../../../../models';

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
        if (response.success && response.data) {
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
      this.router.navigate(['/paciente/citas/medicos', this.medico.id, 'agendar']);
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
    this.router.navigate(['/paciente/citas/medicos']);
  }

  // Helpers
  get estrellas(): { llena: boolean; media: boolean; vacia: boolean }[] {
    const calificacion = this.medico?.calificacion_promedio || 0;
    const estrellas: { llena: boolean; media: boolean; vacia: boolean }[] = [];
    
    for (let i = 1; i <= 5; i++) {
      if (calificacion >= i) {
        // Estrella llena
        estrellas.push({ llena: true, media: false, vacia: false });
      } else if (calificacion >= i - 0.5) {
        // Media estrella
        estrellas.push({ llena: false, media: true, vacia: false });
      } else {
        // Estrella vacía
        estrellas.push({ llena: false, media: false, vacia: true });
      }
    }
    
    return estrellas;
  }

  get tieneMediaEstrella(): boolean {
    const calificacion = this.medico?.calificacion_promedio || 0;
    return calificacion % 1 >= 0.5;
  }

  get certificacionesFormateadas(): Certificacion[] {
    // Retornar las certificaciones reales del médico
    return this.medico?.certificaciones?.map((cert: any) => ({
      nombre: cert.nombre,
      institucion: cert.institucion
    })) || [];
  }

  cargarValoraciones(medicoId: string): void {
    this.loadingValoraciones = true;
    this.valoracionesService.getValoracionesMedico(medicoId, { per_page: 10 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.valoraciones = response.data;
        }
        // Las estadísticas vienen en el mismo response
        if (response.estadisticas) {
          this.estadisticas = response.estadisticas;
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

  getDistribucionPorcentaje(estrellas: number): number {
    if (!this.estadisticas?.distribucion || !this.estadisticas?.total_valoraciones) return 0;
    const cantidad = this.getCantidadPorEstrella(estrellas);
    return (cantidad / this.estadisticas.total_valoraciones) * 100;
  }

  getCantidadPorEstrella(estrellas: number): number {
    if (!this.estadisticas?.distribucion) return 0;
    return (this.estadisticas.distribucion as any)[estrellas] || 0;
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

  estrellasPorCalificacion(calificacion: number): { llena: boolean; media: boolean; vacia: boolean }[] {
    const estrellas: { llena: boolean; media: boolean; vacia: boolean }[] = [];
    
    for (let i = 1; i <= 5; i++) {
      if (calificacion >= i) {
        estrellas.push({ llena: true, media: false, vacia: false });
      } else if (calificacion >= i - 0.5) {
        estrellas.push({ llena: false, media: true, vacia: false });
      } else {
        estrellas.push({ llena: false, media: false, vacia: true });
      }
    }
    
    return estrellas;
  }
}