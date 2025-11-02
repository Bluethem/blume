// src/app/modules/paciente/components/pago-card/pago-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  Pago, 
  ESTADOS_PAGO_LABELS, 
  ESTADOS_PAGO_COLORS,
  METODOS_PAGO_LABELS 
} from '../../../../core/models/pago.model';

@Component({
  selector: 'app-pago-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card pago-card h-100" [class.pendiente]="pago.estado === 'pendiente'">
      <!-- Header con estado -->
      <div class="card-header d-flex justify-content-between align-items-center py-2">
        <span class="badge" [ngClass]="'bg-' + getColorEstado()">
          {{ getLabelEstado() }}
        </span>
        <small class="text-muted">
          <i class="bi bi-calendar3 me-1"></i>
          {{ pago.created_at | date:'dd/MM/yyyy' }}
        </small>
      </div>

      <!-- Body -->
      <div class="card-body">
        <!-- Monto principal -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 class="mb-0 text-success fw-bold">S/ {{ pago.monto | number:'1.2-2' }}</h4>
            <small class="text-muted">{{ pago.concepto }}</small>
          </div>
          <i class="bi bi-credit-card-2-front fs-2 text-primary opacity-50"></i>
        </div>

        <hr class="my-2">

        <!-- Información de la cita -->
        <div class="info-section">
          <div class="info-item">
            <i class="bi bi-person-badge text-primary me-2"></i>
            <span class="text-truncate">{{ pago.cita.medico }}</span>
          </div>

          <div class="info-item" *ngIf="pago.cita.especialidad">
            <i class="bi bi-hospital text-primary me-2"></i>
            <span>{{ pago.cita.especialidad }}</span>
          </div>

          <div class="info-item">
            <i class="bi bi-wallet2 text-primary me-2"></i>
            <span>{{ getLabelMetodo() }}</span>
          </div>

          <div class="info-item" *ngIf="pago.transaction_id">
            <i class="bi bi-receipt text-primary me-2"></i>
            <code class="small">{{ pago.transaction_id }}</code>
          </div>

          <div class="info-item" *ngIf="pago.fecha_pago">
            <i class="bi bi-clock text-primary me-2"></i>
            <span>{{ pago.fecha_pago | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
      </div>

      <!-- Footer con acciones -->
      <div class="card-footer bg-transparent border-top-0 pt-0" *ngIf="mostrarAcciones">
        <button 
          class="btn btn-sm btn-outline-primary w-100"
          (click)="onVerDetalle()">
          <i class="bi bi-eye me-1"></i>
          Ver Detalle
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pago-card {
      transition: all 0.3s ease;
      border: 1px solid #dee2e6;
    }

    .pago-card:hover {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .pago-card.pendiente {
      border-left: 4px solid #ffc107;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
    }

    .info-item i {
      flex-shrink: 0;
    }

    .info-item span {
      flex: 1;
    }

    code {
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.75rem;
    }

    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class PagoCardComponent {
  @Input() pago!: Pago;
  @Input() mostrarAcciones = true;
  @Output() verDetalle = new EventEmitter<Pago>();

  getLabelEstado(): string {
    return ESTADOS_PAGO_LABELS[this.pago.estado];
  }

  getColorEstado(): string {
    return ESTADOS_PAGO_COLORS[this.pago.estado];
  }

  getLabelMetodo(): string {
    return METODOS_PAGO_LABELS[this.pago.metodo_pago];
  }

  onVerDetalle(): void {
    this.verDetalle.emit(this.pago);
  }
}
