import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Medico } from '../../../../services/medicos.service';
import { MedicosService } from '../../../../services/medicos.service';

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

  medico: Medico | null = null;
  loading = true;
  error: string | null = null;

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

  get resenasFormateadas(): Resena[] {
    // Por ahora retornamos datos de ejemplo
    // TODO: Implementar cuando el backend tenga las reseñas
    return [
      {
        nombre_paciente: 'Juan Pérez',
        calificacion: 5,
        comentario: 'Excelente profesional, muy atento y claro en sus explicaciones. Me sentí muy cómodo durante toda la consulta.',
        fecha: 'Hace 2 días'
      },
      {
        nombre_paciente: 'María Rodriguez',
        calificacion: 4,
        comentario: 'Buen doctor, aunque la espera fue un poco larga. El tratamiento ha sido efectivo.',
        fecha: 'Hace 1 semana'
      }
    ];
  }

  estrellasPorCalificacion(calificacion: number): { llenas: number; vacia: boolean } {
    return {
      llenas: Math.floor(calificacion),
      vacia: calificacion < 5
    };
  }
}