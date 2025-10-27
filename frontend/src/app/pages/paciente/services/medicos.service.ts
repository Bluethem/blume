import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Medico, ApiResponse } from '../../../../models';

@Injectable({
  providedIn: 'root'
})
export class MedicosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medicos`;

  /**
   * Obtener lista de médicos con filtros
   */
  getMedicos(filtros?: MedicosFiltros): Observable<ApiResponse<MedicosResponse>> {
    let params = new HttpParams();
    
    if (filtros?.especialidad) {
      params = params.set('especialidad', filtros.especialidad);
    }
    if (filtros?.q) {
      params = params.set('q', filtros.q);
    }
    if (filtros?.page) {
      params = params.set('page', filtros.page.toString());
    }

    return this.http.get<ApiResponse<MedicosResponse>>(this.apiUrl, { params });
  }

  /**
   * Obtener un médico por ID con información detallada
   */
  getMedico(id: string): Observable<ApiResponse<MedicoDetalle>> {
    return this.http.get<ApiResponse<MedicoDetalle>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener horarios disponibles de un médico
   */
  getHorariosDisponibles(medicoId: string, fecha?: string): Observable<ApiResponse<HorarioDisponible[]>> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    
    return this.http.get<ApiResponse<HorarioDisponible[]>>(
      `${this.apiUrl}/${medicoId}/horarios_disponibles`,
      { params }
    );
  }

  /**
   * Obtener especialidades disponibles
   */
  getEspecialidades(): Observable<ApiResponse<Especialidad[]>> {
    return this.http.get<ApiResponse<Especialidad[]>>(`${environment.apiUrl}/especialidades`);
  }

  /**
   * Buscar médicos por nombre o especialidad
   */
  buscarMedicos(query: string): Observable<ApiResponse<MedicoBusqueda[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<MedicoBusqueda[]>>(`${this.apiUrl}/buscar`, { params });
  }
}

// Interfaces auxiliares
export interface MedicosFiltros {
  especialidad?: string;
  q?: string;
  page?: number;
}

export interface MedicosResponse {
  medicos: Medico[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface MedicoDetalle extends Medico {
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
  };
  certificaciones: Certificacion[];
  horarios: HorarioMedico[];
  calificacion_promedio: number;
  total_resenas: number;
}

export interface Certificacion {
  id: string;
  nombre: string;
  institucion: string;
  fecha_obtencion: string;
  fecha_expiracion?: string;
}

export interface HorarioMedico {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface HorarioDisponible {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface MedicoBusqueda {
  id: string;
  nombre_completo: string;
  especialidad_principal: string;
  numero_colegiatura: string;
  foto_url?: string;
}