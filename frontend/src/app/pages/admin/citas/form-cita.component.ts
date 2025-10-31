import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminCitasService, CitaFormData, CitaDetalle } from '../../../services/admin-citas.service';

@Component({
  selector: 'app-form-cita',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './form-cita.component.html',
  styleUrls: ['./form-cita.component.css']
})
export class FormCitaComponent implements OnInit {
  loading = false;
  guardando = false;
  esEdicion = false;
  citaId: string | null = null;

  formData: CitaFormData = {
    paciente_id: '',
    medico_id: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
    motivo_consulta: '',
    costo: 0,
    observaciones: '',
    diagnostico: ''
  };

  // Estados
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private citasService: AdminCitasService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.citaId = this.route.snapshot.params['id'];
    this.esEdicion = !!this.citaId;

    if (this.esEdicion && this.citaId) {
      this.loadCita();
    }
  }

  loadCita(): void {
    if (!this.citaId) return;

    this.loading = true;
    this.citasService.getCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const cita = response.data as CitaDetalle;
          this.formData = {
            paciente_id: cita.paciente.id,
            medico_id: cita.medico.id,
            fecha_hora_inicio: this.formatDateTimeLocal(cita.fecha_hora_inicio),
            fecha_hora_fin: this.formatDateTimeLocal(cita.fecha_hora_fin),
            motivo_consulta: cita.motivo_consulta,
            costo: cita.costo,
            observaciones: cita.observaciones || '',
            diagnostico: cita.diagnostico || ''
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar cita:', error);
        this.mensajeError = 'Error al cargar los datos de la cita';
        this.loading = false;
      }
    });
  }

  guardar(): void {
    // Validaciones básicas
    if (!this.formData.paciente_id) {
      this.mensajeError = 'Selecciona un paciente';
      return;
    }

    if (!this.formData.medico_id) {
      this.mensajeError = 'Selecciona un médico';
      return;
    }

    if (!this.formData.fecha_hora_inicio) {
      this.mensajeError = 'Ingresa la fecha y hora de inicio';
      return;
    }

    if (!this.formData.motivo_consulta) {
      this.mensajeError = 'Ingresa el motivo de consulta';
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    // Calcular fecha_hora_fin si no está establecida
    if (!this.formData.fecha_hora_fin && this.formData.fecha_hora_inicio) {
      const inicio = new Date(this.formData.fecha_hora_inicio);
      const fin = new Date(inicio.getTime() + 30 * 60000); // +30 minutos
      this.formData.fecha_hora_fin = this.formatDateTimeLocal(fin.toISOString());
    }

    const observable = this.esEdicion && this.citaId
      ? this.citasService.updateCita(this.citaId, this.formData)
      : this.citasService.createCita(this.formData);

    observable.subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = this.esEdicion 
            ? 'Cita actualizada exitosamente' 
            : 'Cita creada exitosamente';
          
          setTimeout(() => {
            this.router.navigate(['/admin/citas']);
          }, 1500);
        }
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.mensajeError = error.error?.message || 'Error al guardar la cita';
        this.guardando = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Descartar los cambios?')) {
      this.router.navigate(['/admin/citas']);
    }
  }

  formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
