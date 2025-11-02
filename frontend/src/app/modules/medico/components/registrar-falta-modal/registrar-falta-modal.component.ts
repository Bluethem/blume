// src/app/modules/medico/components/registrar-falta-modal/registrar-falta-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReprogramacionesService } from '../../../../core/services/reprogramaciones.service';
import Swal from 'sweetalert2';

interface Cita {
  id: string;
  fecha_hora_inicio: string;
  paciente: {
    nombre_completo: string;
  };
  medico: {
    nombre_profesional: string;
  };
  estado: string;
  pagado: boolean;
}

@Component({
  selector: 'app-registrar-falta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header bg-danger text-white">
      <h5 class="modal-title">
        <i class="bi bi-person-x me-2"></i>
        Registrar Inasistencia
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
        <h6 class="alert-heading">Información de la Cita</h6>
        <p class="mb-1">
          <strong>Paciente:</strong> {{ cita.paciente.nombre_completo }}
        </p>
        <p class="mb-1">
          <strong>Fecha:</strong> {{ cita.fecha_hora_inicio | date:'dd/MM/yyyy HH:mm' }}
        </p>
        <p class="mb-0">
          <strong>Estado de pago:</strong> 
          <span [class]="cita.pagado ? 'badge bg-success' : 'badge bg-warning'">
            {{ cita.pagado ? 'Pagada' : 'No pagada' }}
          </span>
        </p>
      </div>

      <!-- Selección de quien faltó -->
      <div class="mb-3">
        <label class="form-label fw-bold">
          ¿Quién no asistió?
          <span class="text-danger">*</span>
        </label>
        <div class="btn-group w-100" role="group">
          <input 
            type="radio" 
            class="btn-check" 
            name="quien_falta" 
            id="falta_paciente"
            value="paciente"
            [(ngModel)]="quienFalta"
            [disabled]="procesando">
          <label class="btn btn-outline-danger" for="falta_paciente">
            <i class="bi bi-person-x me-2"></i>
            Paciente
          </label>

          <input 
            type="radio" 
            class="btn-check" 
            name="quien_falta" 
            id="falta_medico"
            value="medico"
            [(ngModel)]="quienFalta"
            [disabled]="procesando">
          <label class="btn btn-outline-warning" for="falta_medico">
            <i class="bi bi-hospital me-2"></i>
            Médico
          </label>
        </div>
      </div>

      <!-- Motivo de la falta -->
      <div class="mb-3">
        <label class="form-label fw-bold">
          Motivo (opcional)
        </label>
        <textarea 
          class="form-control" 
          [(ngModel)]="motivo"
          rows="3"
          placeholder="Describa el motivo de la inasistencia..."
          [disabled]="procesando"
          maxlength="300"></textarea>
        <small class="text-muted">{{ motivo.length }}/300</small>
      </div>

      <!-- Alertas informativas -->
      <div class="alert alert-warning" *ngIf="quienFalta === 'paciente'">
        <i class="bi bi-info-circle me-2"></i>
        <small>
          <strong>Falta del paciente:</strong><br>
          • La cita se marcará como "no_asistió"<br>
          • El paciente será notificado<br>
          <span *ngIf="cita.pagado">
            • Se ofrecerá reprogramación (cita pagada)
          </span>
        </small>
      </div>

      <div class="alert alert-danger" *ngIf="quienFalta === 'medico'">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <small>
          <strong>Falta del médico:</strong><br>
          • La cita se marcará como "no_asistió"<br>
          • El paciente será notificado<br>
          <span *ngIf="cita.pagado">
            • Se creará reprogramación automática<br>
            • Se procesará reembolso si aplica
          </span>
        </small>
      </div>

      <!-- Indicador de procesamiento -->
      <div class="text-center my-3" *ngIf="procesando">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <p class="mt-2 text-muted">Registrando falta...</p>
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
        class="btn btn-danger" 
        (click)="registrarFalta()"
        [disabled]="!quienFalta || procesando">
        <i class="bi bi-exclamation-circle me-2"></i>
        Registrar Inasistencia
      </button>
    </div>
  `,
  styles: [`
    .btn-check:checked + label {
      box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
    }
  `]
})
export class RegistrarFaltaModalComponent implements OnInit {
  @Input() cita!: Cita;

  quienFalta: 'paciente' | 'medico' | '' = '';
  motivo = '';
  procesando = false;

  constructor(
    public activeModal: NgbActiveModal,
    private reprogramacionesService: ReprogramacionesService
  ) {}

  ngOnInit(): void {
    if (!this.cita) {
      console.error('No se proporcionó información de la cita');
      this.activeModal.dismiss();
    }
  }

  registrarFalta(): void {
    if (!this.quienFalta || this.procesando) return;

    // Confirmación
    const nombreFalta = this.quienFalta === 'paciente' 
      ? this.cita.paciente.nombre_completo 
      : 'el médico';

    Swal.fire({
      title: '¿Confirmar inasistencia?',
      html: `
        <p>Se registrará que <strong>${nombreFalta}</strong> no asistió a la cita.</p>
        ${this.cita.pagado && this.quienFalta === 'medico' 
          ? '<p class="text-warning"><small>Se creará una reprogramación automática.</small></p>' 
          : ''}
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarRegistro();
      }
    });
  }

  private procesarRegistro(): void {
    this.procesando = true;

    this.reprogramacionesService.registrarFalta({
      cita_id: this.cita.id,
      quien_falta: this.quienFalta as 'paciente' | 'medico',
      motivo: this.motivo.trim() || undefined
    }).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success) {
          const tieneReprogramacion = response.data.reprogramacion !== undefined;

          Swal.fire({
            icon: 'success',
            title: 'Inasistencia Registrada',
            html: this.getMensajeExito(tieneReprogramacion),
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#0d6efd'
          }).then(() => {
            this.activeModal.close({ 
              success: true, 
              data: response.data,
              reprogramacion: tieneReprogramacion 
            });
          });
        } else {
          this.mostrarError(response.message || 'Error al registrar la falta');
        }
      },
      error: (error) => {
        this.procesando = false;
        console.error('Error al registrar falta:', error);
        const mensaje = error.error?.message || 'Ocurrió un error al registrar la inasistencia';
        this.mostrarError(mensaje);
      }
    });
  }

  private getMensajeExito(tieneReprogramacion: boolean): string {
    let mensaje = `La inasistencia de ${this.quienFalta === 'paciente' ? 'paciente' : 'médico'} ha sido registrada.`;
    
    if (tieneReprogramacion) {
      mensaje += '<br><br><strong class="text-success">✓ Reprogramación automática creada</strong>';
    }
    
    if (this.cita.pagado) {
      mensaje += '<br><small class="text-muted">El paciente recibirá una notificación.</small>';
    }

    return mensaje;
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
}
