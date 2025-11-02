// src/app/modules/paciente/components/pagar-consulta-modal/pagar-consulta-modal.component.ts
import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PagosService } from '../../../../core/services/pagos.service';
import { MetodoPago, METODOS_PAGO_LABELS } from '../../../../core/models/pago.model';
import Swal from 'sweetalert2';

interface Cita {
  id: string;
  fecha_hora_inicio: string;
  medico: {
    nombre_profesional: string;
    especialidad_principal?: {
      nombre: string;
    };
  };
  costo: number | string;
  pagado: boolean;
}

@Component({
  selector: 'app-pagar-consulta-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagar-consulta-modal.component.html',
  styleUrls: ['./pagar-consulta-modal.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PagarConsultaModalComponent implements OnInit {
  @Input() cita!: Cita;

  metodosDisponibles = [
    MetodoPago.TARJETA,
    MetodoPago.YAPE,
    MetodoPago.PLIN,
    MetodoPago.EFECTIVO,
    MetodoPago.TRANSFERENCIA
  ];

  metodoSeleccionado: MetodoPago | null = null;
  procesando = false;

  constructor(
    public activeModal: NgbActiveModal,
    private pagosService: PagosService
  ) {}

  ngOnInit(): void {
    if (!this.cita) {
      console.error('No se proporcionó información de la cita');
      this.activeModal.dismiss();
    }
  }

  get costoNumerico(): number {
    return typeof this.cita.costo === 'string' ? parseFloat(this.cita.costo) : this.cita.costo;
  }

  seleccionarMetodo(metodo: MetodoPago): void {
    if (!this.procesando) {
      this.metodoSeleccionado = metodo;
    }
  }

  getLabelMetodo(metodo: MetodoPago): string {
    return METODOS_PAGO_LABELS[metodo];
  }

  getIconoMetodo(metodo: MetodoPago): string {
    const iconos: { [key in MetodoPago]: string } = {
      efectivo: 'payments',
      tarjeta: 'credit_card',
      transferencia: 'account_balance',
      yape: 'smartphone',
      plin: 'phone_android',
      otro: 'wallet'
    };
    return iconos[metodo];
  }

  getTituloInstrucciones(): string {
    const titulos: { [key in MetodoPago]: string } = {
      tarjeta: 'Pago con Tarjeta',
      yape: 'Pago con Yape',
      plin: 'Pago con Plin',
      efectivo: 'Pago en Efectivo',
      transferencia: 'Transferencia Bancaria',
      otro: 'Otro Método'
    };
    return this.metodoSeleccionado ? titulos[this.metodoSeleccionado] : '';
  }

  getInstrucciones(): string {
    const instrucciones: { [key in MetodoPago]: string } = {
      tarjeta: 'Serás redirigido a la pasarela de pago segura para completar tu transacción.',
      yape: 'Escanea el código QR con tu app Yape o usa el número 999-999-999.',
      plin: 'Escanea el código QR con tu app Plin o usa el número 999-999-999.',
      efectivo: 'Deberás realizar el pago en efectivo en la recepción antes o el día de tu consulta.',
      transferencia: 'Realiza la transferencia a la cuenta BCP: 123-456-789-0. Envía el comprobante por WhatsApp.',
      otro: 'Contacta con nosotros para coordinar otro método de pago.'
    };
    return this.metodoSeleccionado ? instrucciones[this.metodoSeleccionado] : '';
  }

  getIconoBotonPagar(): string {
    if (!this.metodoSeleccionado) return 'credit_card';
    
    const iconos: { [key in MetodoPago]: string } = {
      efectivo: 'task_alt',
      tarjeta: 'credit_card',
      transferencia: 'task_alt',
      yape: 'credit_card',
      plin: 'credit_card',
      otro: 'task_alt'
    };
    return iconos[this.metodoSeleccionado];
  }

  getTextBotonPagar(): string {
    if (this.procesando) return 'Procesando...';
    
    if (this.metodoSeleccionado === MetodoPago.EFECTIVO || 
        this.metodoSeleccionado === MetodoPago.TRANSFERENCIA) {
      return 'Registrar Pago';
    }
    
    return `Pagar S/ ${this.costoNumerico.toFixed(2)}`;
  }

  procesarPago(): void {
    if (!this.metodoSeleccionado || this.procesando) return;

    this.procesando = true;

    this.pagosService.crearPago({
      cita_id: this.cita.id,
      metodo_pago: this.metodoSeleccionado
    }).subscribe({
      next: (response: any) => {
        this.procesando = false;
        
        if (response.success) {
          Swal.fire({
            title: '¡Pago Registrado!',
            text: 'Tu pago ha sido registrado exitosamente',
            icon: 'success',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#B71C1C'
          });
          
          this.activeModal.close({ 
            success: true, 
            pago: response.data 
          });
        }
      },
      error: (error: any) => {
        console.error('Error al procesar pago:', error);
        this.procesando = false;
        
        Swal.fire({
          title: 'Error',
          text: error?.error?.message || 'No se pudo procesar el pago. Por favor, intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#B71C1C'
        });
      }
    });
  }
}
