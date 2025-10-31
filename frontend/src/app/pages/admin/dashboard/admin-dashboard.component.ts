import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AdminDashboardData {
  estadisticas_generales: {
    total_usuarios: number;
    total_pacientes: number;
    total_medicos: number;
    total_administradores: number;
    total_citas: number;
    citas_hoy: number;
    citas_mes: number;
  };
  estadisticas_usuarios: {
    pacientes_activos: number;
    pacientes_inactivos: number;
    medicos_activos: number;
    medicos_inactivos: number;
    nuevos_usuarios_mes: number;
    nuevos_usuarios_semana: number;
  };
  citas_recientes: Array<{
    id: string;
    fecha_hora: string;
    estado: string;
    paciente: string;
    medico: string;
    created_at: string;
  }>;
  actividad_reciente: Array<{
    id: string;
    tipo: string;
    descripcion: string;
    fecha: string;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  dashboardData: AdminDashboardData | null = null;
  loading = true;

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.http.get<ApiResponse<AdminDashboardData>>(`${this.apiUrl}/admin/dashboard`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getEstadoBadge(estado: string): string {
    const badges: {[key: string]: string} = {
      'confirmada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'completada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'cancelada': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return badges[estado] || badges['pendiente'];
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} minutos`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  }

  getActividadIcono(tipo: string): { icono: string; color: string } {
    const iconos: {[key: string]: { icono: string; color: string }} = {
      'usuario_creado': { icono: 'person_add', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' },
      'cita_completada': { icono: 'task_alt', color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' },
      'cita_cancelada': { icono: 'cancel', color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' },
      'certificacion_subida': { icono: 'workspace_premium', color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400' }
    };
    return iconos[tipo] || { icono: 'info', color: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400' };
  }
}
