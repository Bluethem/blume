// src/app/modules/medico/components/aprobar-reprogramacion-modal/aprobar-reprogramacion-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReprogramacionesService } from '../../../../core/services/reprogramaciones.service';
import { Reprogramacion } from '../../../../core/models/reprogramacion.model';
import Swal from 'sweetalert2';

type AccionModal = 'aprobar' | 'rechazar';

@Component({
  selector: 'app-aprobar-reprogramacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-header" [ngClass]="accion === 'aprobar' ? 'bg-success' : 'bg-danger'" class="text-white">
      <h5 class="modal-title text-white">
        <i [class]="accion === 'aprobar' ? 'bi bi-check-circle me-2' : 'bi bi-x-circle me-2'"></i>
        {{ accion === 'aprobar' ? 'Aprobar Reprogramación' : 'Rechazar Reprogramación' }}
      </h5>
      <button 
        type="button" 
        class="btn-close btn-close-white" 
        (click)="activeModal.dismiss()"
        [disabled]="procesando">
      </button>
    </div>

    <div class="modal-body">
      <!-- Información de la reprogramación -->
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="card-subtitle mb-2 text-muted">Detalles de la Solicitud</h6>
          <p class="mb-1">
            <strong>Paciente:</strong> {{ reprogramacion.cita_original.paciente }}
          </p>
          <p class="mb-1">
            <strong>Fecha original:</strong> 
            {{ reprogramacion.cita_original.fecha | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <p class="mb-1">
            <strong>Motivo:</strong> {{ reprogramacion.motivo_label }}
          </p>
          <p class="mb-0">
            <strong>Descripción:</strong> {{ reprogramacion.descripcion }}
          </p>
        </div>
      </div>

      <!-- APROBAR -->
      <div *ngIf="accion === 'aprobar'">
        <label class="form-label fw-bold">
          Seleccione la nueva fecha
          <span class="text-danger">*</span>
        </label>
        <p class="text-muted small mb-3">Elija una de las fechas propuestas por el paciente</p>

        <div class="list-group mb-3">
          <label 
            *ngFor="let fecha of reprogramacion.fechas_propuestas; let i = index"
            class="list-group-item list-group-item-action"
            [class.active]="fechaSeleccionada === fecha">
            <input 
              type="radio" 
              name="fecha" 
              [value]="fecha"
              [(ngModel)]="fechaSeleccionada"
              class="form-check-input me-2"
              [disabled]="procesando">
            <strong>Opción {{ i + 1 }}:</strong> 
            {{ fecha | date:'EEEE, dd/MM/yyyy' }} a las {{ fecha | date:'HH:mm' }}
          </label>
        </div>

        <div class="form-check mb-3">
          <input 
            type="checkbox" 
            class="form-check-input" 
            id="crearCita"
            [(ngModel)]="crearCitaNueva"
            [disabled]="procesando">
          <label class="form-check-label" for="crearCita">
            Crear nueva cita automáticamente
            <small class="text-muted d-block">
              Se creará una nueva cita con la fecha seleccionada
            </small>
          </label>
        </div>

        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          <small>
            Al aprobar, la cita original será cancelada y 
            {{ crearCitaNueva ? 'se creará una nueva cita' : 'el paciente deberá reagendar' }}.
          </small>
        </div>
      </div>

      <!-- RECHAZAR -->
      <div *ngIf="accion === 'rechazar'">
        <label class="form-label fw-bold">
          Motivo del rechazo
          <span class="text-danger">*</span>
        </label>
        <textarea 
          class="form-control" 
          [(ngModel)]="motivoRechazo"
          rows="4"
          placeholder="Explique el motivo del rechazo..."
          [disabled]="procesando"
          maxlength="500"></textarea>
        <small class="text-muted">{{ motivoRechazo.length }}/500</small>

        <div class="alert alert-warning mt-3">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <small>
            El paciente será notificado del rechazo con el motivo especificado.
          </small>
        </div>
      </div>

      <!-- Indicador de procesamiento -->
      <div class="text-center my-3" *ngIf="procesando">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <p class="mt-2 text-muted">Procesando...</p>
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
        [class]="accion === 'aprobar' ? 'btn btn-success' : 'btn btn-danger'"
        (click)="confirmar()"
        [disabled]="!esValido() || procesando">
        <i [class]="accion === 'aprobar' ? 'bi bi-check-circle me-2' : 'bi bi-x-circle me-2'"></i>
        {{ accion === 'aprobar' ? 'Aprobar' : 'Rechazar' }}
      </button>
    </div>
  `,
  styles: [`
    .list-group-item.active {
      z-index: 0;
    }

    .list-group-item:hover {
      cursor: pointer;
    }
  `]
})
export class AprobarReprogramacionModalComponent implements OnInit {
  @Input() reprogramacion!: Reprogramacion;
  @Input() accion: AccionModal = 'aprobar';

  fechaSeleccionada: string | null = null;
  crearCitaNueva = true;
  motivoRechazo = '';
  procesando = false;

  constructor(
    public activeModal: NgbActiveModal,
    private reprogramacionesService: ReprogramacionesService
  ) {}

  ngOnInit(): void {
    if (!this.reprogramacion) {
      console.error('No se proporcionó información de la reprogramación');
      this.activeModal.dismiss();
      return;
    }

    // Pre-seleccionar la primera fecha si es aprobar
    if (this.accion === 'aprobar' && this.reprogramacion.fechas_propuestas.length > 0) {
      this.fechaSeleccionada = this.reprogramacion.fechas_propuestas[0];
    }
  }

  esValido(): boolean {
    if (this.accion === 'aprobar') {
      return !!this.fechaSeleccionada;
    } else {
      return this.motivoRechazo.trim().length > 0;
    }
  }

  confirmar(): void {
    if (!this.esValido() || this.procesando) return;

    this.procesando = true;

    if (this.accion === 'aprobar') {
      this.aprobar();
    } else {
      this.rechazar();
    }
  }

  private aprobar(): void {
    if (!this.fechaSeleccionada) return;

    this.reprogramacionesService.aprobarReprogramacion(
      this.reprogramacion.id,
      {
        fecha_seleccionada: this.fechaSeleccionada,
        crear_cita_nueva: this.crearCitaNueva
      }
    ).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '¡Reprogramación Aprobada!',
            text: response.message || 'La reprogramación ha sido aprobada exitosamente',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#198754'
          }).then(() => {
            this.activeModal.close({ success: true, data: response.data });
          });
        } else {
          this.mostrarError(response.message || 'Error al aprobar');
        }
      },
      error: (error) => {
        this.procesando = false;
        console.error('Error al aprobar:', error);
        const mensaje = error.error?.message || 'Ocurrió un error al aprobar la reprogramación';
        this.mostrarError(mensaje);
      }
    });
  }

  private rechazar(): void {
    this.reprogramacionesService.rechazarReprogramacion(
      this.reprogramacion.id,
      { motivo_rechazo: this.motivoRechazo.trim() }
    ).subscribe({
      next: (response) => {
        this.procesando = false;

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reprogramación Rechazada',
            text: 'La solicitud ha sido rechazada',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#0d6efd'
          }).then(() => {
            this.activeModal.close({ success: true, data: response.data });
          });
        } else {
          this.mostrarError(response.message || 'Error al rechazar');
        }
      },
      error: (error) => {
        this.procesando = false;
        console.error('Error al rechazar:', error);
        const mensaje = error.error?.message || 'Ocurrió un error al rechazar la reprogramación';
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
}
