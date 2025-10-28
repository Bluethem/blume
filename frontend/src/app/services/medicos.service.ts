import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
  anos_experiencia: number;
  costo_consulta: number;
  biografia?: string;
  calificacion: number;
  foto_url?: string;
  certificaciones?: string[];
  disponible_hoy?: boolean;
}

export interface HorarioDisponible {
  fecha: string;
  dia_semana: string;
  disponible: boolean;
  horarios: SlotHorario[];
  duracion_cita: number;
}

export interface SlotHorario {
  fecha_hora: string;
  hora_display: string;
  disponible: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/medicos`;

  /**
   * Obtener lista de médicos
   */
  getMedicos(params?: {
    q?: string;
    especialidad?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(this.apiUrl, { params: params as any });
  }

  /**
   * Obtener detalle de un médico
   */
  getMedico(id: string): Observable<ApiResponse<Medico>> {
    return this.http.get<ApiResponse<Medico>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener horarios disponibles de un médico
   */
  getHorariosDisponibles(medicoId: string, fecha: string): Observable<ApiResponse<HorarioDisponible>> {
    return this.http.get<ApiResponse<HorarioDisponible>>(
      `${this.apiUrl}/${medicoId}/horarios_disponibles`,
      { params: { fecha } }
    );
  }

  /**
   * Buscar médicos disponibles
   */
  buscarMedicos(query: string): Observable<ApiResponse<Medico[]>> {
    return this.http.get<ApiResponse<Medico[]>>(`${this.apiUrl}/buscar`, {
      params: { q: query }
    });
  }
}