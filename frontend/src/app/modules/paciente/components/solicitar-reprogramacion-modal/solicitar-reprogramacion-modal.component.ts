// src/app/modules/paciente/components/solicitar-reprogramacion-modal/solicitar-reprogramacion-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReprogramacionesService } from '../../../../core/services/reprogramaciones.service';
import {
  MotivoReprogramacion,
  MOTIVOS_REPROGRAMACION_LABELS
} from '../../../../core/models/reprogramacion.model';
import Swal from 'sweetalert2';

interface Cita {
  id: string;
  fecha_hora_inicio: string;
  medico: {
    nombre_profesional: string;
  };
  motivo_consulta: string;
  costo: number;
}

@Component({
  selector: 'app-solicitar-reprogramacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header bg-warning text-white">
      <h5 class="modal-title">
        <i class="bi bi-calendar2-x me-2"></i>
        Solicitar Reprogramación
      </h5>
      <button 
        type="button" 
        class="btn-close btn-close-white" 
        (click)="activeModal.dismiss()"
        [disabled]="procesando">
      </button>
    </div>

    <div class="modal-body">
      <!-- Información de la cita -->
      <div class="alert alert-info">
        <h6 class="alert-heading">Cita a Reprogramar:</h6>
        <p class="mb-1"><strong>Médico:</strong> {{ cita.medico.nombre_profesional }}</p>
        <p class="mb-1"><strong>Fecha actual:</strong> {{ cita.fecha_hora_inicio | date:'dd/MM/yyyy HH:mm' }}</p>
        <p class="mb-0"><strong>Motivo:</strong> {{ cita.motivo_consulta }}</p>
      </div>

      <!-- Formulario -->
      <form>
        <!-- Motivo -->
        <div class="mb-3">
          <label class="form-label fw-bold">
            Motivo de la reprogramación
            <span class="text-danger">*</span>
          </label>
          <select 
            class="form-select" 
            [(ngModel)]="motivo" 
            name="motivo"
            [disabled]="procesando"
            required>
            <option value="">Seleccione un motivo</option>
            <option [value]="MotivoReprogramacion.SOLICITUD_PACIENTE">
              {{ getLabelMotivo(MotivoReprogramacion.SOLICITUD_PACIENTE) }}
            </option>
          </select>
        </div>

        <!-- Descripción -->
        <div class="mb-3">
          <label class="form-label fw-bold">
            Descripción breve
            <span class="text-danger">*</span>
          </label>
          <input 
            type="text" 
            class="form-control" 
            [(ngModel)]="descripcion"
            name="descripcion"
            placeholder="Ej: Inconveniente de horario"
            [disabled]="procesando"
            maxlength="200"
            required>
          <small class="text-muted">{{ descripcion.length }}/200</small>
        </div>

        <!-- Justificación -->
        <div class="mb-3">
          <label class="form-label fw-bold">
            Justificación detallada
            <span class="text-danger">*</span>
          </label>
          <textarea 
            class="form-control" 
            [(ngModel)]="justificacion"
            name="justificacion"
            rows="3"
            placeholder="Explique el motivo de su solicitud..."
            [disabled]="procesando"
            maxlength="500"
            required></textarea>
          <small class="text-muted">{{ justificacion.length }}/500</small>
        </div>

        <!-- Fechas propuestas -->
        <div class="mb-3">
          <label class="form-label fw-bold">
            Proponga nuevas fechas
            <span class="text-danger">*</span>
          </label>
          <p class="text-muted small">Debe proponer al menos una fecha alternativa</p>
          
          <!-- Fecha 1 -->
          <div class="mb-2">
            <label class="form-label small">Opción 1 (obligatoria)</label>
            <input 
              type="datetime-local" 
              class="form-control" 
              [(ngModel)]="fecha1"
              name="fecha1"
              [min]="fechaMinima"
              [disabled]="procesando"
              required>
          </div>

          <!-- Fecha 2 -->
          <div class="mb-2">
            <label class="form-label small">Opción 2 (opcional)</label>
            <input 
              type="datetime-local" 
              class="form-control" 
              [(ngModel)]="fecha2"
              name="fecha2"
              [min]="fechaMinima"
              [disabled]="procesando">
          </div>

          <!-- Fecha 3 -->
          <div class="mb-2">
            <label class="form-label small">Opción 3 (opcional)</label>
            <input 
              type="datetime-local" 
              class="form-control" 
              [(ngModel)]="fecha3"
              name="fecha3"
              [min]="fechaMinima"
              [disabled]="procesando">
          </div>
        </div>

        <!-- Advertencia -->
        <div class="alert alert-warning">
          <small>
            <i class="bi bi-exclamation-triangle me-2"></i>
            Su solicitud será revisada por el médico. Una vez aprobada, se confirmará la nueva fecha.
          </small>
        </div>
      </form>

      <!-- Indicador de procesamiento -->
      <div class="text-center my-3" *ngIf="procesando">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <p class="mt-2 text-muted">Enviando solicitud...</p>
      </div>
    </div>

    <div class="modal-footer">
      <button 
        type="button" 
        class="btn btn-secondary" 
        (click)="activeModal.dismiss()"
        [disabled]="procesando">
        Cancelar
      </button>
      <button 
        type="button" 
        class="btn btn-warning" 
        (click)="enviarSolicitud()"
        [disabled]="!formularioValido() || procesando">
        <i class="bi bi-send me-2"></i>
        Enviar Solicitud
      </button>
    </div>
  `,
  styles: [`
    .form-label.fw-bold {
      margin-bottom: 0.25rem;
    }

    .text-danger {
      font-size: 0.9rem;
    }

    input[type="datetime-local"]:disabled,
    select:disabled,
    textarea:disabled {
      background-color: #e9ecef;
    }
  `]
})
export class SolicitarReprogramacionModalComponent implements OnInit {
  @Input() cita!: Cita;

  MotivoReprogramacion = MotivoReprogramacion;

  motivo: MotivoReprogramacion | '' = '';
  descripcion = '';
  justificacion = '';
  fecha1 = '';
  fecha2 = '';
  fecha3 = '';
  
  procesando = false;
  fechaMinima = '';

  constructor(
    public activeModal: NgbActiveModal,
    private reprogramacionesService: ReprogramacionesService
  ) {}

  ngOnInit(): void {
    if (!this.cita) {
      console.error('No se proporcionó información de la cita');
      this.activeModal.dismiss();
      return;
    }

    // Establecer fecha mínima (mañana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    this.fechaMinima = this.formatDatetimeLocal(manana);
  }

  getLabelMotivo(motivo: MotivoReprogramacion): string {
    return MOTIVOS_REPROGRAMACION_LABELS[motivo];
  }

  formularioValido(): boolean {
    return !!(
      this.motivo &&
      this.descripcion.trim() &&
      this.justificacion.trim() &&
      this.fecha1
    );
  }

  enviarSolicitud(): void {
    if (!this.formularioValido() || this.procesando) return;

    this.procesando = true;

    this.reprogramacionesService.solicitarReprogramacion({
      cita_id: this.cita.id,
      motivo: this.motivo as MotivoReprogramacion,
      descripcion: this.descripcion.trim(),
      justificacion: this.justificacion.trim(),
      fecha_propuesta_1: this.fecha1,
      fecha_propuesta_2: this.fecha2 || undefined,
      fecha_propuesta_3: this.fecha3 || undefined
    }).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Solicitud Enviada!',
            text: response.message || 'Tu solicitud de reprogramación ha sido enviada al médico.',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#ffc107'
          }).then(() => {
            this.activeModal.close({ success: true, data: response.data });
          });
        } else {
          this.mostrarError(response.message || 'Error al enviar la solicitud');
        }
      },
      error: (error) => {
        this.procesando = false;
        console.error('Error al enviar solicitud:', error);

        const mensaje = error.error?.message || 
                       error.error?.errors?.[0] || 
                       'Ocurrió un error al enviar la solicitud.';
        
        this.mostrarError(mensaje);
      }
    });
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }

  private formatDatetimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
