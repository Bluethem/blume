import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Estadisticas {
  total_citas_atendidas: number;
  tasa_no_asistencia: number;
  calificacion_promedio: number;
  cambio_citas: number;
  cambio_no_asistencia: number;
  cambio_calificacion: number;
  distribucion_estados: {
    completadas: number;
    canceladas: number;
    no_asistio: number;
  };
  citas_por_mes: {
    mes: string;
    total: number;
    completadas: number;
    canceladas: number;
  }[];
  citas_recientes: CitaReciente[];
}

interface CitaReciente {
  id: string;
  paciente_nombre: string;
  fecha: string;
  hora: string;
  estado: string;
  motivo_consulta: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-mis-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-estadisticas.component.html',
  styleUrls: ['./mis-estadisticas.component.css']
})
export class MisEstadisticasComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  estadisticas: Estadisticas | null = null;
  loading = false;

  // Filtros
  periodoActivo: string = 'semana';
  periodos = [
    { value: 'semana', label: 'Esta Semana' },
    { value: 'mes', label: 'Este Mes' },
    { value: 'trimestre', label: 'Últimos 3 Meses' },
    { value: 'anio', label: 'Este Año' }
  ];

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.loading = true;
    this.http.get<ApiResponse<Estadisticas>>(`${this.apiUrl}/medico/estadisticas`, {
      params: { periodo: this.periodoActivo }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticas = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cambiarPeriodo(periodo: string): void {
    this.periodoActivo = periodo;
    this.cargarEstadisticas();
  }

  getPeriodoLabel(): string {
    const periodo = this.periodos.find(p => p.value === this.periodoActivo);
    return periodo ? periodo.label : 'Este Mes';
  }

  exportarDatos(): void {
    // TODO: Implementar exportación a CSV/PDF
    alert('Funcionalidad de exportación en desarrollo');
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'completada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'confirmada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'no_asistio': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return clases[estado] || clases['confirmada'];
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'completada': 'Atendida',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'no_asistio': 'No Asistió'
    };
    return labels[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Cálculo para el gráfico circular (donut chart)
  calcularPorcentajeCompletadas(): number {
    if (!this.estadisticas) return 0;
    const total = this.estadisticas.distribucion_estados.completadas + 
                  this.estadisticas.distribucion_estados.canceladas + 
                  this.estadisticas.distribucion_estados.no_asistio;
    return total > 0 ? (this.estadisticas.distribucion_estados.completadas / total) * 100 : 0;
  }

  calcularPorcentajeCanceladas(): number {
    if (!this.estadisticas) return 0;
    const total = this.estadisticas.distribucion_estados.completadas + 
                  this.estadisticas.distribucion_estados.canceladas + 
                  this.estadisticas.distribucion_estados.no_asistio;
    return total > 0 ? (this.estadisticas.distribucion_estados.canceladas / total) * 100 : 0;
  }

  calcularPorcentajeNoAsistio(): number {
    if (!this.estadisticas) return 0;
    const total = this.estadisticas.distribucion_estados.completadas + 
                  this.estadisticas.distribucion_estados.canceladas + 
                  this.estadisticas.distribucion_estados.no_asistio;
    return total > 0 ? (this.estadisticas.distribucion_estados.no_asistio / total) * 100 : 0;
  }

  // Obtener path SVG para el gráfico circular
  getCirclePath(porcentaje: number, offset: number = 0): string {
    const circunferencia = 2 * Math.PI * 15.915;
    const dash = (porcentaje / 100) * circunferencia;
    return `${dash}, ${circunferencia}`;
  }

  getCircleOffset(offset: number): number {
    const circunferencia = 2 * Math.PI * 15.915;
    return -(offset / 100) * circunferencia;
  }
}
