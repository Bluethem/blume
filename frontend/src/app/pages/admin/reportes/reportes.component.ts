import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AdminReportesService, DashboardData, CitaDetalle } from '../../../services/admin-reportes.service';
import { PdfService } from '../../../services/pdf.service';
import { ExcelService } from '../../../services/excel.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, AfterViewInit {
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  loading = false;
  descargandoPdf = false; // ✅ NUEVO
  descargandoExcel = false; // ✅ NUEVO
  dashboardData: DashboardData | null = null;
  citasDetalle: CitaDetalle[] = [];
  
  // Charts
  lineChart: any = null;
  pieChart: any = null;

  // Filtros
  tipoReporte = 'citas_periodo';
  fechaInicio = '';
  fechaFin = '';

  // Paginación para tabla
  currentPage = 1;
  totalPages = 1;
  perPage = 10;

  constructor(
    private reportesService: AdminReportesService,
    private pdfService: PdfService,
    private excelService: ExcelService
  ) {
    // Establecer fechas por defecto (últimos 30 días)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.fechaFin = this.formatDate(today);
    this.fechaInicio = this.formatDate(thirtyDaysAgo);
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadDashboard(): void {
    this.loading = true;

    this.reportesService.getDashboard(this.fechaInicio, this.fechaFin).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData = response.data;
          this.loadCitasDetalle();
          
          // Esperar un tick para que el DOM se actualice
          setTimeout(() => {
            this.createCharts();
          }, 100);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar dashboard:', error);
        this.loading = false;
      }
    });
  }

  loadCitasDetalle(): void {
    this.reportesService.getCitasDetalle(this.fechaInicio, this.fechaFin, this.currentPage, this.perPage).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.citasDetalle = response.data.citas;
          this.totalPages = response.data.meta.total_pages;
        }
      },
      error: (error) => {
        console.error('Error al cargar detalle de citas:', error);
      }
    });
  }

  generarReporte(): void {
    this.currentPage = 1;
    this.loadDashboard();
  }

  createCharts(): void {
    if (!this.dashboardData) return;

    this.createLineChart();
    this.createPieChart();
  }

  createLineChart(): void {
    if (!this.dashboardData || !this.lineChartCanvas) return;

    // Destruir chart anterior si existe
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dashboardData.graficos.citas_por_dia;
    const labels = data.map(item => {
      const date = new Date(item.fecha);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    const values = data.map(item => item.total);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Citas por día',
          data: values,
          borderColor: '#D93B3B',
          backgroundColor: 'rgba(217, 59, 59, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#D93B3B',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.lineChart = new Chart(ctx, config);
  }

  createPieChart(): void {
    if (!this.dashboardData || !this.pieChartCanvas) return;

    // Destruir chart anterior si existe
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.dashboardData.graficos.citas_por_medico.slice(0, 6); // Top 6
    const labels = data.map(item => item.medico_nombre);
    const values = data.map(item => item.total_citas);

    const colors = [
      '#D93B3B',
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#8B5CF6',
      '#EC4899'
    ];

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} citas (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  getEstadoClass(estado: string): string {
    const estados: { [key: string]: string } = {
      'completada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'confirmada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'no_asistio': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  }

  exportarPDF(): void {
    this.descargandoPdf = true;
    
    this.pdfService.exportarReportesPdf(this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const nombreArchivo = `Reporte_Citas_${this.fechaInicio}_${this.fechaFin}.pdf`;
        this.pdfService.descargarArchivo(blob, nombreArchivo);
        this.descargandoPdf = false;
      },
      error: (error) => {
        console.error('Error al exportar PDF:', error);
        alert('Error al generar el PDF. Por favor, intenta nuevamente.');
        this.descargandoPdf = false;
      }
    });
  }

  exportarExcel(): void {
    this.descargandoExcel = true;
    
    this.excelService.exportarReportes('citas', this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const nombreArchivo = `Reporte_Citas_${this.fechaInicio}_${this.fechaFin}.xlsx`;
        this.excelService.descargarArchivo(blob, nombreArchivo);
        this.descargandoExcel = false;
      },
      error: (error) => {
        console.error('Error al exportar Excel:', error);
        alert('Error al generar el archivo Excel. Por favor, intenta nuevamente.');
        this.descargandoExcel = false;
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCitasDetalle();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCitasDetalle();
    }
  }

  get totalCitas(): number {
    return this.dashboardData?.kpis.total_citas || 0;
  }

  get ingresosGenerados(): number {
    return this.dashboardData?.kpis.ingresos_generados || 0;
  }

  get pacientesNuevos(): number {
    return this.dashboardData?.kpis.pacientes_nuevos || 0;
  }

  get medicoTopNombre(): string {
    return this.dashboardData?.kpis.medico_top.nombre || 'N/A';
  }

  get medicoTopCitas(): number {
    return this.dashboardData?.kpis.medico_top.total_citas || 0;
  }
}
