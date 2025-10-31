import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cita {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  medico_id: string;
  medico_nombre: string;
  especialidad: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo_consulta: string;
  estado: string;
  estado_display: string;
  costo: number;
  created_at: string;
}

export interface CitaDetalle {
  id: string;
  paciente: {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
  };
  medico: {
    id: string;
    nombre: string;
    especialidad: string;
    email: string;
  };
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  duracion_minutos: number;
  motivo_consulta: string;
  estado: string;
  estado_display: string;
  costo: number;
  observaciones?: string;
  diagnostico?: string;
  motivo_cancelacion?: string;
  created_at: string;
  updated_at: string;
}

export interface CitasResponse {
  success: boolean;
  data?: {
    citas: Cita[];
    meta: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
  message?: string;
  errors?: string[];
}

export interface CitaResponse {
  success: boolean;
  data?: CitaDetalle | Cita;
  message?: string;
  errors?: string[];
}

export interface CitaFormData {
  paciente_id: string;
  medico_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo_consulta: string;
  costo?: number;
  observaciones?: string;
  diagnostico?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCitasService {
  private apiUrl = `${environment.apiUrl}/admin/citas`;

  constructor(private http: HttpClient) {}

  getCitas(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    estado?: string;
    medico_id?: string;
    paciente_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Observable<CitasResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<CitasResponse>(this.apiUrl, { params: httpParams });
  }

  getCita(id: string): Observable<CitaResponse> {
    return this.http.get<CitaResponse>(`${this.apiUrl}/${id}`);
  }

  createCita(data: CitaFormData): Observable<CitaResponse> {
    return this.http.post<CitaResponse>(this.apiUrl, { cita: data });
  }

  updateCita(id: string, data: Partial<CitaFormData>): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`${this.apiUrl}/${id}`, { cita: data });
  }

  deleteCita(id: string): Observable<CitaResponse> {
    return this.http.delete<CitaResponse>(`${this.apiUrl}/${id}`);
  }

  cancelarCita(id: string, motivo?: string): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`${this.apiUrl}/${id}/cancelar`, { motivo_cancelacion: motivo });
  }

  confirmarCita(id: string): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  completarCita(id: string): Observable<CitaResponse> {
    return this.http.put<CitaResponse>(`${this.apiUrl}/${id}/completar`, {});
  }

  cancelarMultiples(citaIds: string[], motivo?: string): Observable<CitaResponse> {
    return this.http.post<CitaResponse>(`${this.apiUrl}/cancelar_multiples`, {
      cita_ids: citaIds,
      motivo_cancelacion: motivo
    });
  }

  exportar(params?: { search?: string; estado?: string }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);

    return this.http.get<any>(`${this.apiUrl}/exportar`, { params: httpParams });
  }
}
