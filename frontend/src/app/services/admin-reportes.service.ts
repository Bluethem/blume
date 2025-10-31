import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface KPIs {
  total_citas: number;
  ingresos_generados: number;
  pacientes_nuevos: number;
  medico_top: {
    nombre: string;
    total_citas: number;
  };
}

export interface CitaPorDia {
  fecha: string;
  total: number;
}

export interface CitaPorMedico {
  medico_id: string;
  medico_nombre: string;
  total_citas: number;
}

export interface DashboardData {
  kpis: KPIs;
  graficos: {
    citas_por_dia: CitaPorDia[];
    citas_por_medico: CitaPorMedico[];
    citas_por_estado: { [key: string]: number };
  };
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}

export interface CitaDetalle {
  id: string;
  fecha: string;
  hora: string;
  paciente: {
    id: string;
    nombre_completo: string;
  };
  medico: {
    id: string;
    nombre_completo: string;
  };
  estado: string;
  estado_label: string;
  costo: number;
  ingreso: number;
}

export interface MedicoRanking {
  medico_id: string;
  nombre_completo: string;
  total_citas: number;
  citas_completadas: number;
  ingresos_generados: number;
}

export interface IngresosData {
  ingresos_por_dia: Array<{ fecha: string; total: number }>;
  total_ingresos: number;
  promedio_diario: number;
  dias_analizados: number;
}

export interface PacientesNuevosData {
  pacientes_por_dia: Array<{ fecha: string; total: number }>;
  total_pacientes_nuevos: number;
}

export interface ReportesResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminReportesService {
  private apiUrl = `${environment.apiUrl}/admin/reportes`;

  constructor(private http: HttpClient) {}

  getDashboard(fechaInicio?: string, fechaFin?: string): Observable<ReportesResponse<DashboardData>> {
    let params = new HttpParams();
    
    if (fechaInicio) {
      params = params.set('fecha_inicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }

    return this.http.get<ReportesResponse<DashboardData>>(`${this.apiUrl}/dashboard`, { params });
  }

  getCitasDetalle(
    fechaInicio?: string, 
    fechaFin?: string,
    page?: number,
    perPage?: number
  ): Observable<ReportesResponse<{ citas: CitaDetalle[]; meta: any }>> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);
    if (page) params = params.set('page', page.toString());
    if (perPage) params = params.set('per_page', perPage.toString());

    return this.http.get<ReportesResponse<{ citas: CitaDetalle[]; meta: any }>>(`${this.apiUrl}/citas_detalle`, { params });
  }

  getMedicosRanking(fechaInicio?: string, fechaFin?: string): Observable<ReportesResponse<{ medicos: MedicoRanking[] }>> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ReportesResponse<{ medicos: MedicoRanking[] }>>(`${this.apiUrl}/medicos_ranking`, { params });
  }

  getIngresos(fechaInicio?: string, fechaFin?: string): Observable<ReportesResponse<IngresosData>> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ReportesResponse<IngresosData>>(`${this.apiUrl}/ingresos`, { params });
  }

  getPacientesNuevos(fechaInicio?: string, fechaFin?: string): Observable<ReportesResponse<PacientesNuevosData>> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ReportesResponse<PacientesNuevosData>>(`${this.apiUrl}/pacientes_nuevos`, { params });
  }

  exportar(tipo: 'pdf' | 'excel', reporteTipo: string, fechaInicio?: string, fechaFin?: string): Observable<ReportesResponse<any>> {
    const body = {
      tipo,
      reporte_tipo: reporteTipo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    };

    return this.http.post<ReportesResponse<any>>(`${this.apiUrl}/exportar`, body);
  }
}
