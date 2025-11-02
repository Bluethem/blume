// src/app/modules/paciente/components/historial-pagos/historial-pagos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagosService } from '../../../../core/services/pagos.service';
import { 
  Pago, 
  EstadoPago, 
  MetodoPago,
  ESTADOS_PAGO_LABELS, 
  ESTADOS_PAGO_COLORS,
  METODOS_PAGO_LABELS 
} from '../../../../core/models/pago.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial-pagos.component.html',
  styles: []
})
export class HistorialPagosComponent implements OnInit {
  pagos: Pago[] = [];
  citasConPagosAdicionales: any[] = [];  // ✅ NUEVO: Citas con pagos pendientes
  cargando = false;
  cargandoAdicionales = false;
  paginaActual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  porPagina = 12;

  filtros = {
    estado: '',
    metodo: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  constructor(private pagosService: PagosService) {}

  ngOnInit(): void {
    this.cargarPagos();
    this.cargarPagosAdicionales();  // ✅ NUEVO
  }

  // ✅ NUEVO: Cargar citas con pagos adicionales pendientes
  cargarPagosAdicionales(): void {
    this.cargandoAdicionales = true;
    
    // Endpoint que devuelve citas completadas con requiere_pago_adicional = true
    this.pagosService.getCitasConPagosAdicionales().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.citasConPagosAdicionales = response.data;
        }
        this.cargandoAdicionales = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pagos adicionales:', error);
        this.cargandoAdicionales = false;
      }
    });
  }

  cargarPagos(): void {
    this.cargando = true;

    const params: any = {
      page: this.paginaActual,
      per_page: this.porPagina
    };

    if (this.filtros.estado) params.estado = this.filtros.estado;
    if (this.filtros.metodo) params.tipo = this.filtros.metodo;
    if (this.filtros.fecha_desde) params.fecha_desde = this.filtros.fecha_desde;
    if (this.filtros.fecha_hasta) params.fecha_hasta = this.filtros.fecha_hasta;

    this.pagosService.getPagos(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pagos = response.data.pagos;
          this.totalRegistros = response.data.total;
          this.totalPaginas = response.data.total_pages;
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pagos:', error);
        this.cargando = false;
        this.pagos = [];
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarPagos();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarPagos();
    }
  }

  getPaginas(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  getLabelEstado(estado: EstadoPago): string {
    return ESTADOS_PAGO_LABELS[estado];
  }

  getColorEstado(estado: EstadoPago): string {
    return ESTADOS_PAGO_COLORS[estado];
  }

  getLabelMetodo(metodo: MetodoPago): string {
    return METODOS_PAGO_LABELS[metodo];
  }

  // ✅ NUEVO: Pagar monto adicional
  pagarAdicional(cita: any): void {
    // Mostrar selector de método de pago con SweetAlert2
    Swal.fire({
      title: 'Pagar Cargo Adicional',
      html: `
        <div class="text-left">
          <p class="mb-4"><strong>Monto a pagar:</strong> <span class="text-2xl text-warning font-bold">S/ ${cita.monto_adicional.toFixed(2)}</span></p>
          <p class="mb-2"><strong>Médico:</strong> ${cita.medico?.nombre_profesional}</p>
          <p class="mb-4 text-sm text-gray-600">${this.extraerConceptoAdicional(cita.observaciones)}</p>
          
          <label class="block text-sm font-bold mb-2">Método de Pago:</label>
          <select id="metodo-pago" class="w-full p-2 border rounded">
            <option value="tarjeta">💳 Tarjeta de Crédito/Débito</option>
            <option value="yape">📱 Yape</option>
            <option value="plin">📱 Plin</option>
            <option value="transferencia">🏦 Transferencia Bancaria</option>
            <option value="efectivo">💵 Efectivo</option>
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Procesar Pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#B71C1C',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const select = document.getElementById('metodo-pago') as HTMLSelectElement;
        return select.value;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPagoAdicional(cita.id, result.value);
      }
    });
  }

  // Procesar el pago adicional
  private procesarPagoAdicional(citaId: string, metodoPago: string): void {
    Swal.fire({
      title: 'Procesando...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.pagosService.pagarAdicional(citaId, metodoPago).subscribe({
      next: (response: any) => {
        Swal.fire({
          title: '¡Pago Exitoso!',
          html: `
            <p class="text-lg mb-2">El pago adicional se procesó correctamente</p>
            <p class="text-3xl text-success font-bold my-4">✓</p>
            <p class="text-sm text-gray-600">Recibirás un comprobante en tu correo</p>
          `,
          icon: 'success',
          confirmButtonColor: '#B71C1C'
        }).then(() => {
          // Recargar los pagos
          this.cargarPagos();
          this.cargarPagosAdicionales();
        });
      },
      error: (error: any) => {
        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'No se pudo procesar el pago',
          icon: 'error',
          confirmButtonColor: '#B71C1C'
        });
      }
    });
  }

  // ✅ NUEVO: Extraer concepto del cargo adicional de las observaciones
  extraerConceptoAdicional(observaciones: string): string {
    if (!observaciones) return 'Sin especificar';
    
    // Buscar el patrón [Cargo adicional: S/ X - Concepto]
    const match = observaciones.match(/\[Cargo adicional:.*?-\s*(.+?)\]/);
    return match ? match[1] : 'Sin especificar';
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

  verDetalle(pago: Pago): void {
    // TODO: Implementar modal de detalle o navegación
    console.log('Ver detalle del pago:', pago);
  }
}
