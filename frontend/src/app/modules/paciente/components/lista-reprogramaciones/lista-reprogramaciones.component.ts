// src/app/modules/paciente/components/lista-reprogramaciones/lista-reprogramaciones.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReprogramacionesService } from '../../../../core/services/reprogramaciones.service';
import {
  Reprogramacion,
  EstadoReprogramacion,
  ESTADOS_REPROGRAMACION_LABELS,
  ESTADOS_REPROGRAMACION_COLORS,
  MOTIVOS_REPROGRAMACION_LABELS
} from '../../../../core/models/reprogramacion.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-reprogramaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-reprogramaciones.component.html',
  styles: []
})
export class ListaReprogramacionesComponent implements OnInit {
  reprogramaciones: Reprogramacion[] = [];
  cargando = false;
  paginaActual = 1;
  totalPaginas = 1;
  totalRegistros = 0;
  porPagina = 12;

  filtroEstado: string = '';

  constructor(private reprogramacionesService: ReprogramacionesService) {}

  ngOnInit(): void {
    this.cargarReprogramaciones();
  }

  cargarReprogramaciones(): void {
    this.cargando = true;

    const params: any = {
      page: this.paginaActual,
      per_page: this.porPagina
    };

    if (this.filtroEstado) {
      params.estado = this.filtroEstado;
    }

    this.reprogramacionesService.getReprogramacionesPaciente(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.reprogramaciones = response.data.reprogramaciones;
          this.totalRegistros = response.data.total;
          this.totalPaginas = response.data.total_pages;
        }
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al cargar reprogramaciones:', error);
        this.cargando = false;
        this.reprogramaciones = [];
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarReprogramaciones();
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.paginaActual = 1;
    this.cargarReprogramaciones();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.cargarReprogramaciones();
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

  verDetalle(reprogramacion: Reprogramacion): void {
    // TODO: Implementar modal o navegación a detalle
    console.log('Ver detalle de reprogramación:', reprogramacion);
  }

  cancelarReprogramacion(id: string): void {
    Swal.fire({
      title: '¿Cancelar solicitud?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (result.isConfirmed) {
        this.reprogramacionesService.cancelarReprogramacion(id).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Cancelada!', 'La solicitud ha sido cancelada', 'success');
              this.cargarReprogramaciones();
            }
          },
          error: (error) => {
            Swal.fire('Error', 'No se pudo cancelar la solicitud', 'error');
          }
        });
      }
    });
  }
}
