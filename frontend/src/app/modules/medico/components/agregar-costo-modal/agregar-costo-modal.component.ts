import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-costo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar-costo-modal.component.html',
  styles: []
})
export class AgregarCostoModalComponent {
  @Input() cita: any;

  monto: number = 0;
  concepto: string = '';
  procesando = false;

  // Conceptos predefinidos
  conceptosPredefinidos = [
    'Procedimiento adicional',
    'Medicamentos',
    'Exámenes de laboratorio',
    'Radiografías',
    'Materiales especiales',
    'Consulta extendida',
    'Otro'
  ];

  constructor(public activeModal: NgbActiveModal) {}

  seleccionarConcepto(concepto: string): void {
    if (concepto === 'Otro') {
      this.concepto = '';
    } else {
      this.concepto = concepto;
    }
  }

  agregar(): void {
    // Validaciones
    if (!this.monto || this.monto <= 0) {
      Swal.fire({
        title: 'Error',
        text: 'Debe ingresar un monto válido mayor a 0',
        icon: 'error',
        confirmButtonColor: '#B71C1C'
      });
      return;
    }

    if (!this.concepto || this.concepto.trim() === '') {
      Swal.fire({
        title: 'Error',
        text: 'Debe especificar el concepto del cargo adicional',
        icon: 'error',
        confirmButtonColor: '#B71C1C'
      });
      return;
    }

    // Confirmar antes de agregar
    Swal.fire({
      title: '¿Confirmar Cargo Adicional?',
      html: `
        <div class="text-left">
          <p><strong>Concepto:</strong> ${this.concepto}</p>
          <p><strong>Monto:</strong> S/ ${this.monto.toFixed(2)}</p>
          <p class="text-sm text-gray-600 mt-3">
            El paciente será notificado y deberá pagar este monto adicional.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#B71C1C',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarAgregar();
      }
    });
  }

  private confirmarAgregar(): void {
    this.activeModal.close({
      monto: this.monto,
      concepto: this.concepto
    });
  }

  get montoValido(): boolean {
    return this.monto > 0;
  }

  get conceptoValido(): boolean {
    return this.concepto.trim().length > 0;
  }

  get formularioValido(): boolean {
    return this.montoValido && this.conceptoValido && !this.procesando;
  }
}
