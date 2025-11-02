import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PagosService } from '../../../../core/services/pagos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-pago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-pago.component.html',
  styles: []
})
export class DetallePagoComponent implements OnInit {
  pago: any = null;
  cargando = true;
  pagoId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagosService: PagosService
  ) {}

  ngOnInit(): void {
    this.pagoId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.pagoId) {
      this.router.navigate(['/paciente/pagos']);
      return;
    }

    this.cargarDetallePago();
  }

  cargarDetallePago(): void {
    this.cargando = true;
    // ✅ CAMBIADO: obtenerPago() → getPago()
    this.pagosService.getPago(this.pagoId).subscribe({
      next: (response: any) => {
        this.pago = response.data;
        this.cargando = false;
      },
      error: (error: any) => {
        this.cargando = false;
        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'No se pudo cargar el detalle del pago',
          icon: 'error',
          confirmButtonColor: '#B71C1C'
        });
        this.router.navigate(['/paciente/pagos']);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/paciente/pagos']);
  }

  descargarComprobante(): void {
    Swal.fire({
      title: 'Descargando...',
      text: 'Generando comprobante de pago',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        // Aquí iría la lógica para descargar el PDF
        setTimeout(() => {
          Swal.fire({
            title: '¡Listo!',
            text: 'Comprobante descargado exitosamente',
            icon: 'success',
            confirmButtonColor: '#B71C1C',
            timer: 2000
          });
        }, 1500);
      }
    });
  }

  enviarComprobantePorEmail(): void {
    Swal.fire({
      title: '¿Enviar comprobante?',
      text: 'Se enviará una copia del comprobante a tu correo electrónico',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#B71C1C',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '¡Enviado!',
          text: 'El comprobante ha sido enviado a tu correo',
          icon: 'success',
          confirmButtonColor: '#B71C1C',
          timer: 2000
        });
      }
    });
  }

  get estadoClass(): string {
    const clases: { [key: string]: string } = {
      'completado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'procesando': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'fallido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'reembolsado': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'cancelado': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return clases[this.pago?.estado] || clases['pendiente'];
  }

  get estadoLabel(): string {
    const labels: { [key: string]: string } = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'procesando': 'Procesando',
      'fallido': 'Fallido',
      'reembolsado': 'Reembolsado',
      'cancelado': 'Cancelado'
    };
    return labels[this.pago?.estado] || 'Desconocido';
  }

  get estadoIcono(): string {
    const iconos: { [key: string]: string } = {
      'completado': 'check_circle',
      'pendiente': 'schedule',
      'procesando': 'hourglass_empty',
      'fallido': 'error',
      'reembolsado': 'replay',
      'cancelado': 'cancel'
    };
    return iconos[this.pago?.estado] || 'help';
  }

  get tipoLabel(): string {
    const tipos: { [key: string]: string } = {
      'pago_consulta': 'Pago de Consulta',
      'pago_adicional': 'Pago Adicional',
      'reembolso': 'Reembolso'
    };
    return tipos[this.pago?.tipo_pago] || 'Pago';
  }

  get metodoLabel(): string {
    const metodos: { [key: string]: string } = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta de Crédito/Débito',
      'transferencia': 'Transferencia Bancaria',
      'yape': 'Yape',
      'plin': 'Plin',
      'otro': 'Otro'
    };
    return metodos[this.pago?.metodo_pago] || 'No especificado';
  }

  get metodoIcono(): string {
    const iconos: { [key: string]: string } = {
      'efectivo': 'payments',
      'tarjeta': 'credit_card',
      'transferencia': 'account_balance',
      'yape': 'smartphone',
      'plin': 'phone_android',
      'otro': 'wallet'
    };
    return iconos[this.pago?.metodo_pago] || 'payment';
  }
}