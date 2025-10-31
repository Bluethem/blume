import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EstadisticasDashboard {
  total_citas_hoy: number;
  total_citas_semana: number;
  total_medicos_activos: number;
  total_pacientes: number;
  ingresos_mes: number;
  citas_pendientes: number;
  nuevos_pacientes_mes: number;
  tasa_ocupacion: number;
}

export interface CitaHoy {
  id: string;
  paciente_nombre: string;
  medico_nombre: string;
  fecha_hora: string;
  motivo_consulta: string;
  estado: string;
  estado_display: string;
}

export interface CitaReciente {
  id: string;
  paciente_nombre: string;
  medico_nombre: string;
  fecha_hora: string;
  estado: string;
  estado_display: string;
  created_at: string;
}

export interface ActividadReciente {
  tipo: string;
  descripcion: string;
  fecha: string;
  icono: string;
}

export interface DashboardData {
  estadisticas: EstadisticasDashboard;
  citas_hoy: CitaHoy[];
  citas_recientes: CitaReciente[];
  actividad_reciente: ActividadReciente[];
  grafico_citas_semana: Array<{ dia: string; total: number }>;
  grafico_estados: Array<{ estado: string; total: number }>;
  medicos_top: Array<{ nombre: string; citas: number }>;
}

export interface DashboardResponse {
  success: boolean;
  data?: DashboardData;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }
}
