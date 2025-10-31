import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PacienteListItem {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  foto_url?: string;
  grupo_sanguineo?: string;
  tiene_alergias: boolean;
  fecha_registro: string;
  ultima_cita?: string;
  activo: boolean;
  created_at: string;
}

export interface PacienteDetalle {
  id: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
    foto_url?: string;
    activo: boolean;
  };
  numero_documento: string;
  tipo_documento: string;
  fecha_nacimiento: string;
  genero: string;
  grupo_sanguineo?: string;
  alergias?: string;
  observaciones?: string;
  estadisticas: {
    total_citas: number;
    citas_completadas: number;
    proxima_cita?: string;
  };
}

export interface CreatePacienteRequest {
  paciente: {
    numero_documento: string;
    tipo_documento: string;
    fecha_nacimiento: string;
    genero: string;
    grupo_sanguineo?: string;
    alergias?: string;
    observaciones?: string;
    usuario_attributes: {
      nombre: string;
      apellido: string;
      email: string;
      telefono?: string;
      direccion?: string;
      password: string;
      password_confirmation: string;
    };
  };
}

export interface UpdatePacienteRequest {
  paciente: {
    numero_documento?: string;
    tipo_documento?: string;
    fecha_nacimiento?: string;
    genero?: string;
    grupo_sanguineo?: string;
    alergias?: string;
    observaciones?: string;
    usuario_attributes?: {
      nombre?: string;
      apellido?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
    };
  };
}

export interface PacientesResponse {
  success: boolean;
  data?: {
    pacientes: PacienteListItem[];
    meta: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
  message?: string;
}

export interface PacienteResponse {
  success: boolean;
  data?: PacienteDetalle;
  message?: string;
}

export interface ToggleEstadoResponse {
  success: boolean;
  data?: { activo: boolean };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPacientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/pacientes`;

  getPacientes(
    page: number = 1,
    perPage: number = 10,
    search?: string,
    grupoSanguineo?: string,
    conAlergias?: boolean,
    activo?: boolean
  ): Observable<PacientesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (grupoSanguineo) {
      params = params.set('grupo_sanguineo', grupoSanguineo);
    }

    if (conAlergias !== undefined) {
      params = params.set('con_alergias', conAlergias.toString());
    }

    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<PacientesResponse>(this.apiUrl, { params });
  }

  getPaciente(id: string): Observable<PacienteResponse> {
    return this.http.get<PacienteResponse>(`${this.apiUrl}/${id}`);
  }

  createPaciente(request: CreatePacienteRequest): Observable<PacienteResponse> {
    return this.http.post<PacienteResponse>(this.apiUrl, request);
  }

  updatePaciente(id: string, request: UpdatePacienteRequest): Observable<PacienteResponse> {
    return this.http.put<PacienteResponse>(`${this.apiUrl}/${id}`, request);
  }

  deletePaciente(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${id}`);
  }

  toggleEstado(id: string): Observable<ToggleEstadoResponse> {
    return this.http.post<ToggleEstadoResponse>(`${this.apiUrl}/${id}/toggle_estado`, {});
  }
}
