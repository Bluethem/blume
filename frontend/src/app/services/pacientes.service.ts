import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

interface InfoMedica {
  fecha_nacimiento?: string;
  genero?: string;
  grupo_sanguineo?: string;
  alergias?: string;
  observaciones?: string;
  enfermedades_cronicas?: string;
  medicamentos_actuales?: string;
  cirugias_previas?: string;
  antecedentes_familiares?: string;
}

interface HistorialMedico {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  medico?: {
    nombre_completo: string;
    especialidad: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pacientes`;

  /**
   * Obtener perfil del paciente actual
   */
  getPerfil(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/perfil`);
  }

  /**
   * Actualizar información médica del paciente
   */
  updateInfoMedica(data: InfoMedica): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/info-medica`, {
      paciente: data
    });
  }

  /**
   * Actualizar información personal del paciente
   */
  updateInfoPersonal(data: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    direccion?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/info-personal`, data);
  }

  /**
   * Obtener historial médico del paciente
   */
  getHistorialMedico(params?: {
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<HistorialMedico[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<HistorialMedico[]>>(`${this.apiUrl}/historial-medico`, {
      params: httpParams
    });
  }

  /**
   * Obtener documentos médicos del paciente
   */
  getDocumentos(params?: {
    tipo?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documentos`, {
      params: httpParams
    });
  }

  /**
   * Subir documento médico
   */
  subirDocumento(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documentos`, formData);
  }

  /**
   * Eliminar documento médico
   */
  eliminarDocumento(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/documentos/${id}`);
  }

  /**
   * Obtener estadísticas del paciente
   */
  getEstadisticas(): Observable<ApiResponse<{
    total_citas: number;
    citas_completadas: number;
    proximas_citas: number;
    medicos_visitados: number;
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/estadisticas`);
  }

  /**
   * Obtener recetas médicas del paciente
   */
  getRecetas(params?: {
    activas?: boolean;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value.toString() !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/recetas`, {
      params: httpParams
    });
  }

  /**
   * Obtener análisis y estudios del paciente
   */
  getAnalisis(params?: {
    tipo?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    page?: number;
    per_page?: number;
  }): Observable<ApiResponse<any[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/analisis`, {
      params: httpParams
    });
  }

  /**
   * Actualizar preferencias de notificaciones
   */
  updatePreferenciasNotificaciones(data: {
    email_notificaciones?: boolean;
    sms_notificaciones?: boolean;
    recordatorios_citas?: boolean;
  }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/preferencias-notificaciones`, data);
  }

  /**
   * Exportar historial médico
   */
  exportarHistorial(formato: 'pdf' | 'excel'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportar-historial`, {
      params: { formato },
      responseType: 'blob'
    });
  }

  /**
   * Buscar paciente (para uso del médico)
   */
  buscarPaciente(query: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/buscar`, {
      params: { q: query }
    });
  }

  /**
   * Obtener paciente por ID (para uso del médico)
   */
  getPaciente(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear paciente (admin)
   */
  crearPaciente(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, { paciente: data });
  }

  /**
   * Actualizar paciente (admin)
   */
  actualizarPaciente(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, { paciente: data });
  }

  /**
   * Eliminar paciente (admin)
   */
  eliminarPaciente(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}