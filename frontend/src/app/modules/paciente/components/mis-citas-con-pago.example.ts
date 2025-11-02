/**
 * EJEMPLO DE INTEGRACIÓN
 * Este archivo muestra cómo integrar el sistema de pagos en un componente de citas existente
 * NO es un componente funcional, solo una guía de referencia
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PagarConsultaModalComponent } from './pagar-consulta-modal/pagar-consulta-modal.component';
import { PagosService } from '../../../core/services/pagos.service';
import Swal from 'sweetalert2';

interface Cita {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  motivo_consulta: string;
  costo: number;
  pagado: boolean;
  medico: {
    nombre_profesional: string;
    especialidad_principal?: {
      nombre: string;
    };
  };
}

@Component({
  selector: 'app-mis-citas-ejemplo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid py-4">
      <h2>Mis Citas</h2>

      <!-- Loading -->
      <div class="text-center" *ngIf="cargando">
        <div class="spinner-border"></div>
      </div>

      <!-- Lista de citas -->
      <div class="row" *ngIf="!cargando">
        <div class="col-md-6 col-lg-4 mb-4" *ngFor="let cita of citas">
          <div class="card">
            <div class="card-header">
              <span class="badge bg-primary">{{ cita.estado }}</span>
            </div>
            <div class="card-body">
              <h5>{{ cita.medico.nombre_profesional }}</h5>
              <p class="text-muted">{{ cita.medico.especialidad_principal?.nombre }}</p>
              <p>
                <i class="bi bi-calendar"></i>
                {{ cita.fecha_hora_inicio | date:'dd/MM/yyyy HH:mm' }}
              </p>
              <p class="fw-bold text-success">
                S/ {{ cita.costo | number:'1.2-2' }}
              </p>

              <!-- Estado de pago -->
              <div class="mt-3">
                <!-- Si está pagado -->
                <div *ngIf="cita.pagado" class="alert alert-success">
                  <i class="bi bi-check-circle me-2"></i>
                  Consulta Pagada
                </div>

                <!-- Si NO está pagado -->
                <div *ngIf="!cita.pagado">
                  <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Pago Pendiente
                  </div>
                  
                  <!-- Botón para pagar -->
                  <button 
                    class="btn btn-success w-100"
                    (click)="abrirModalPago(cita)">
                    <i class="bi bi-credit-card me-2"></i>
                    Pagar Consulta
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn btn-sm btn-outline-primary">
                Ver Detalle
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Widget de pagos pendientes -->
      <div class="alert alert-warning" *ngIf="totalPagosPendientes > 0">
        <h5>
          <i class="bi bi-exclamation-triangle me-2"></i>
          Pagos Pendientes
        </h5>
        <p class="mb-2">
          Tienes <strong>{{ totalPagosPendientes }}</strong> pago(s) pendiente(s)
          por un total de <strong>S/ {{ montoPendiente | number:'1.2-2' }}</strong>
        </p>
        <button 
          class="btn btn-sm btn-warning"
          (click)="verPagosPendientes()">
          <i class="bi bi-eye me-1"></i>
          Ver Pagos Pendientes
        </button>
      </div>
    </div>
  `
})
export class MisCitasEjemploComponent implements OnInit {
  citas: Cita[] = [];
  cargando = false;
  totalPagosPendientes = 0;
  montoPendiente = 0;

  constructor(
    private modalService: NgbModal,
    private pagosService: PagosService
  ) {}

  ngOnInit(): void {
    this.cargarCitas();
    this.verificarPagosPendientes();
  }

  /**
   * Cargar lista de citas
   */
  cargarCitas(): void {
    this.cargando = true;
    // Aquí iría la llamada a tu servicio de citas
    // this.citasService.getMisCitas().subscribe(...)
    this.cargando = false;
  }

  /**
   * Abrir modal de pago para una cita
   */
  abrirModalPago(cita: Cita): void {
    // Verificar que la cita sea válida
    if (!cita || cita.pagado) {
      Swal.fire({
        icon: 'info',
        title: 'Cita ya pagada',
        text: 'Esta cita ya ha sido pagada'
      });
      return;
    }

    // Abrir modal de pago
    const modalRef = this.modalService.open(PagarConsultaModalComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static', // No cerrar al hacer click fuera
      keyboard: false     // No cerrar con ESC mientras procesa
    });

    // Pasar datos de la cita al modal
    modalRef.componentInstance.cita = cita;

    // Manejar el resultado del modal
    modalRef.result.then(
      (result) => {
        // Modal cerrado con éxito (pago realizado)
        if (result && result.success) {
          console.log('Pago exitoso:', result.pago);
          
          // Actualizar la cita localmente
          const index = this.citas.findIndex(c => c.id === cita.id);
          if (index !== -1) {
            this.citas[index].pagado = true;
          }

          // Recargar citas desde el servidor
          this.cargarCitas();
          
          // Actualizar contador de pagos pendientes
          this.verificarPagosPendientes();

          // Mostrar mensaje de éxito adicional si es necesario
          this.mostrarMensajeExito(result.pago);
        }
      },
      (reason) => {
        // Modal cerrado sin acción (usuario canceló)
        console.log('Modal cerrado:', reason);
      }
    );
  }

  /**
   * Verificar si hay pagos pendientes
   */
  verificarPagosPendientes(): void {
    this.pagosService.getPagosPendientes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalPagosPendientes = response.data.total;
          this.montoPendiente = response.data.pagos.reduce(
            (sum, pago) => sum + pago.monto, 
            0
          );

          // Mostrar notificación si hay pagos pendientes
          if (this.totalPagosPendientes > 0) {
            this.mostrarNotificacionPendientes();
          }
        }
      },
      error: (error) => {
        console.error('Error al verificar pagos pendientes:', error);
      }
    });
  }

  /**
   * Navegar a la página de pagos pendientes
   */
  verPagosPendientes(): void {
    // this.router.navigate(['/paciente/pagos'], { 
    //   queryParams: { estado: 'pendiente' } 
    // });
    console.log('Navegar a pagos pendientes');
  }

  /**
   * Mostrar mensaje de éxito personalizado
   */
  private mostrarMensajeExito(pago: any): void {
    if (pago.estado === 'completado') {
      Swal.fire({
        icon: 'success',
        title: '¡Pago Exitoso!',
        html: `
          <p>Tu pago ha sido procesado correctamente.</p>
          <hr>
          <p><strong>Monto:</strong> S/ ${pago.monto.toFixed(2)}</p>
          <p><strong>Método:</strong> ${pago.metodo_pago}</p>
          <p><strong>ID:</strong> ${pago.transaction_id}</p>
        `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0d6efd'
      });
    } else if (pago.estado === 'pendiente') {
      Swal.fire({
        icon: 'info',
        title: 'Pago Registrado',
        text: 'Tu pago ha sido registrado y está pendiente de confirmación.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#0d6efd'
      });
    }
  }

  /**
   * Mostrar notificación de pagos pendientes (solo una vez por sesión)
   */
  private mostrarNotificacionPendientes(): void {
    // Verificar si ya se mostró en esta sesión
    const yaSeNotifico = sessionStorage.getItem('notificacion_pagos_mostrada');
    
    if (!yaSeNotifico && this.totalPagosPendientes > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Pagos Pendientes',
        text: `Tienes ${this.totalPagosPendientes} pago(s) pendiente(s) por un total de S/ ${this.montoPendiente.toFixed(2)}`,
        showCancelButton: true,
        confirmButtonText: 'Ver Pagos',
        cancelButtonText: 'Después',
        confirmButtonColor: '#0d6efd'
      }).then((result) => {
        if (result.isConfirmed) {
          this.verPagosPendientes();
        }
      });

      // Marcar como mostrado
      sessionStorage.setItem('notificacion_pagos_mostrada', 'true');
    }
  }
}

/**
 * NOTAS DE IMPLEMENTACIÓN:
 * 
 * 1. Importar en tu módulo/componente:
 *    - NgbModal para modales
 *    - PagosService para llamadas API
 *    - PagarConsultaModalComponent
 * 
 * 2. Asegurarse de tener las dependencias:
 *    npm install @ng-bootstrap/ng-bootstrap sweetalert2
 * 
 * 3. Configurar providers en app.config.ts:
 *    - provideAnimations()
 *    - provideHttpClient()
 * 
 * 4. El botón "Pagar" solo se muestra si:
 *    - cita.pagado === false
 *    - El estado de la cita lo permite (confirmada/pendiente)
 * 
 * 5. Después de un pago exitoso:
 *    - Se actualiza la cita localmente
 *    - Se recarga la lista desde el servidor
 *    - Se actualiza el contador de pagos pendientes
 * 
 * 6. Personalizar según tu diseño:
 *    - Cambiar colores en las clases CSS
 *    - Ajustar mensajes de SweetAlert2
 *    - Agregar más validaciones según tu lógica de negocio
 */
