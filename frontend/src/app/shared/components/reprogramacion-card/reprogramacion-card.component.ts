// src/app/shared/components/reprogramacion-card/reprogramacion-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Reprogramacion,
  ESTADOS_REPROGRAMACION_LABELS,
  ESTADOS_REPROGRAMACION_COLORS,
  MOTIVOS_REPROGRAMACION_ICONS
} from '../../../core/models/reprogramacion.model';

@Component({
  selector: 'app-reprogramacion-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card reprog-card h-100" [class.pendiente]="reprogramacion.estado === 'pendiente'">
      <!-- Header -->
      <div class="card-header d-flex justify-content-between align-items-center py-2">
        <span class="badge" [ngClass]="'bg-' + getColorEstado()">
          {{ getLabelEstado() }}
        </span>
        <small class="text-muted">
          <i class="bi bi-calendar3 me-1"></i>
          {{ reprogramacion.created_at | date:'dd/MM/yyyy' }}
        </small>
      </div>

      <!-- Body -->
      <div class="card-body">
        <!-- Icono y motivo -->
        <div class="d-flex align-items-start mb-3">
          <i [class]="'bi ' + getIconoMotivo() + ' fs-2 text-warning me-3'"></i>
          <div class="flex-fill">
            <h6 class="mb-1">{{ reprogramacion.motivo_label }}</h6>
            <p class="text-muted small mb-0">{{ reprogramacion.descripcion }}</p>
          </div>
        </div>

        <hr class="my-2">

        <!-- Cita original -->
        <div class="info-section mb-2">
          <small class="text-muted d-block mb-1">Cita Original:</small>
          <div class="d-flex align-items-center mb-1">
            <i class="bi bi-person-badge text-primary me-2"></i>
            <span class="small">
              {{ vistaPaciente ? reprogramacion.cita_original.medico : reprogramacion.cita_original.paciente }}
            </span>
          </div>
          <div class="d-flex align-items-center">
            <i class="bi bi-calendar-event text-primary me-2"></i>
            <span class="small">{{ reprogramacion.cita_original.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>

        <!-- Fechas propuestas -->
        <div class="mb-2" *ngIf="reprogramacion.fechas_propuestas.length > 0">
          <small class="text-muted d-block mb-1">Fechas Propuestas:</small>
          <div class="fechas-container">
            <div 
              *ngFor="let fecha of reprogramacion.fechas_propuestas; let i = index"
              class="fecha-badge"
              [class.seleccionada]="fecha === reprogramacion.fecha_seleccionada">
              <i class="bi bi-clock me-1"></i>
              <small>{{ fecha | date:'dd/MM HH:mm' }}</small>
              <i *ngIf="fecha === reprogramacion.fecha_seleccionada" class="bi bi-check-circle-fill ms-1"></i>
            </div>
          </div>
        </div>

        <!-- Badges informativos -->
        <div class="d-flex flex-wrap gap-1 mt-2">
          <span class="badge bg-info" *ngIf="reprogramacion.requiere_reembolso">
            <i class="bi bi-cash me-1"></i>
            {{ reprogramacion.reembolso_procesado ? 'Reembolsado' : 'Reembolso' }}
          </span>
          <span class="badge bg-secondary" *ngIf="reprogramacion.cita_original.pagado">
            <i class="bi bi-credit-card me-1"></i>
            Pagada
          </span>
        </div>
      </div>

      <!-- Footer con acciones -->
      <div class="card-footer bg-transparent border-top-0 pt-0" *ngIf="mostrarAcciones">
        <div class="btn-group w-100" role="group">
          <button 
            class="btn btn-sm btn-outline-primary"
            (click)="onVerDetalle()"
            *ngIf="accionVer">
            <i class="bi bi-eye"></i>
          </button>
          <button 
            class="btn btn-sm btn-outline-success"
            (click)="onAprobar()"
            *ngIf="accionAprobar && reprogramacion.estado === 'pendiente'">
            <i class="bi bi-check-circle"></i>
          </button>
          <button 
            class="btn btn-sm btn-outline-danger"
            (click)="onRechazar()"
            *ngIf="accionRechazar && reprogramacion.estado === 'pendiente'">
            <i class="bi bi-x-circle"></i>
          </button>
          <button 
            class="btn btn-sm btn-outline-secondary"
            (click)="onCancelar()"
            *ngIf="accionCancelar && reprogramacion.estado === 'pendiente'">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reprog-card {
      transition: all 0.3s ease;
      border: 1px solid #dee2e6;
    }

    .reprog-card:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .reprog-card.pendiente {
      border-left: 4px solid #ffc107;
    }

    .info-section {
      font-size: 0.875rem;
    }

    .fechas-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .fecha-badge {
      background-color: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      border: 1px solid #dee2e6;
    }

    .fecha-badge.seleccionada {
      background-color: #d1e7dd;
      border-color: #198754;
      color: #0f5132;
      font-weight: 500;
    }

    .btn-group .btn {
      flex: 1;
    }
  `]
})
export class ReprogramacionCardComponent {
  @Input() reprogramacion!: Reprogramacion;
  @Input() vistaPaciente = true; // true = mostrar médico, false = mostrar paciente
  @Input() mostrarAcciones = true;
  @Input() accionVer = true;
  @Input() accionAprobar = false;
  @Input() accionRechazar = false;
  @Input() accionCancelar = false;

  @Output() verDetalle = new EventEmitter<Reprogramacion>();
  @Output() aprobar = new EventEmitter<Reprogramacion>();
  @Output() rechazar = new EventEmitter<Reprogramacion>();
  @Output() cancelar = new EventEmitter<Reprogramacion>();

  getLabelEstado(): string {
    return ESTADOS_REPROGRAMACION_LABELS[this.reprogramacion.estado];
  }

  getColorEstado(): string {
    return ESTADOS_REPROGRAMACION_COLORS[this.reprogramacion.estado];
  }

  getIconoMotivo(): string {
    return MOTIVOS_REPROGRAMACION_ICONS[this.reprogramacion.motivo];
  }

  onVerDetalle(): void {
    this.verDetalle.emit(this.reprogramacion);
  }

  onAprobar(): void {
    this.aprobar.emit(this.reprogramacion);
  }

  onRechazar(): void {
    this.rechazar.emit(this.reprogramacion);
  }

  onCancelar(): void {
    this.cancelar.emit(this.reprogramacion);
  }
}
