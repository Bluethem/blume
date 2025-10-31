import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDashboardService, DashboardData } from '../../../services/admin-dashboard.service';

declare const Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  loading = false;
  data: DashboardData | null = null;
  
  // Charts
  citasSemanaChart: any;
  estadosChart: any;

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  loadDashboard(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.data = response.data;
          // Esperar un momento para que el DOM se actualice
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

  createCharts(): void {
    if (!this.data) return;

    this.createCitasSemanaChart();
    this.createEstadosChart();
  }

  createCitasSemanaChart(): void {
    const canvas = document.getElementById('citasSemanaChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.citasSemanaChart) {
      this.citasSemanaChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.citasSemanaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data!.grafico_citas_semana.map(d => d.dia),
        datasets: [{
          label: 'Citas',
          data: this.data!.grafico_citas_semana.map(d => d.total),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
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
    });
  }

  createEstadosChart(): void {
    const canvas = document.getElementById('estadosChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.estadosChart) {
      this.estadosChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colores = [
      '#FCD34D', // Pendiente
      '#34D399', // Confirmada
      '#60A5FA', // Completada
      '#F87171', // Cancelada
      '#9CA3AF'  // No asistió
    ];

    this.estadosChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.data!.grafico_estados.map(d => d.estado),
        datasets: [{
          data: this.data!.grafico_estados.map(d => d.total),
          backgroundColor: colores,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  getEstadoClase(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'confirmada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'completada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'no_asistio': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  formatHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }

  getTimeAgo(fecha: string): string {
    const now = new Date();
    const date = new Date(fecha);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
}
