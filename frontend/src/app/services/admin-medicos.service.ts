import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MedicoListItem {
  id: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  foto_url?: string;
  numero_colegiatura: string;
  especialidad_principal?: string;
  total_certificaciones: number;
  citas_mes: number;
  activo: boolean;
  created_at: string;
}

export interface MedicoDetalle {
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
  numero_colegiatura: string;
  anios_experiencia: number;
  costo_consulta: number;
  biografia?: string;
  especialidades: Array<{
    id: string;
    nombre: string;
    es_principal: boolean;
  }>;
  certificaciones: Array<{
    id: string;
    nombre: string;
    institucion: string;
    fecha_obtencion: string;
  }>;
  estadisticas: {
    total_citas: number;
    citas_mes: number;
    calificacion_promedio: number;
    total_resenas: number;
  };
}

export interface CreateMedicoRequest {
  medico: {
    numero_colegiatura: string;
    anios_experiencia: number;
    costo_consulta: number;
    biografia?: string;
    usuario_attributes: {
      nombre: string;
      apellido: string;
      email: string;
      telefono?: string;
      direccion?: string;
      password: string;
      password_confirmation: string;
    };
    especialidades?: Array<{
      especialidad_id: string;
      es_principal: boolean;
    }>;
    certificaciones?: Array<{
      certificacion_id: string;
      fecha_obtencion?: string;
    }>;
  };
}

export interface UpdateMedicoRequest {
  medico: {
    numero_colegiatura?: string;
    anios_experiencia?: number;
    costo_consulta?: number;
    biografia?: string;
    usuario_attributes?: {
      nombre?: string;
      apellido?: string;
      email?: string;
      telefono?: string;
      direccion?: string;
    };
    especialidades?: Array<{
      especialidad_id: string;
      es_principal: boolean;
    }>;
    certificaciones?: Array<{
      certificacion_id: string;
      fecha_obtencion?: string;
    }>;
  };
}

export interface MedicosResponse {
  success: boolean;
  data?: {
    medicos: MedicoListItem[];
    meta: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
  message?: string;
}

export interface MedicoResponse {
  success: boolean;
  data?: MedicoDetalle;
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
export class AdminMedicosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/medicos`;

  getMedicos(page: number = 1, perPage: number = 10, search?: string, especialidadId?: string, activo?: boolean): Observable<MedicosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (especialidadId) {
      params = params.set('especialidad_id', especialidadId);
    }

    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<MedicosResponse>(this.apiUrl, { params });
  }

  getMedico(id: string): Observable<MedicoResponse> {
    return this.http.get<MedicoResponse>(`${this.apiUrl}/${id}`);
  }

  createMedico(request: CreateMedicoRequest): Observable<MedicoResponse> {
    return this.http.post<MedicoResponse>(this.apiUrl, request);
  }

  updateMedico(id: string, request: UpdateMedicoRequest): Observable<MedicoResponse> {
    return this.http.put<MedicoResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteMedico(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${id}`);
  }

  toggleEstado(id: string): Observable<ToggleEstadoResponse> {
    return this.http.post<ToggleEstadoResponse>(`${this.apiUrl}/${id}/toggle_estado`, {});
  }
}
