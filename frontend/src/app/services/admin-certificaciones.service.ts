import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Certificacion {
  id: string;
  nombre: string;
  institucion_emisora?: string;
  descripcion?: string;
  total_medicos: number;
  created_at: string;
}

export interface CertificacionDetalle {
  id: string;
  nombre: string;
  institucion_emisora?: string;
  descripcion?: string;
  total_medicos: number;
  medicos: {
    id: string;
    nombre_completo: string;
    especialidad: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface CreateCertificacionRequest {
  certificacion: {
    nombre: string;
    institucion_emisora?: string;
    descripcion?: string;
  };
}

export interface UpdateCertificacionRequest {
  certificacion: {
    nombre?: string;
    institucion_emisora?: string;
    descripcion?: string;
  };
}

export interface CertificacionesResponse {
  success: boolean;
  data?: {
    certificaciones: Certificacion[];
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

export interface CertificacionResponse {
  success: boolean;
  data?: CertificacionDetalle;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminCertificacionesService {
  private apiUrl = `${environment.apiUrl}/admin/certificaciones`;

  constructor(private http: HttpClient) {}

  getCertificaciones(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Observable<CertificacionesResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<CertificacionesResponse>(this.apiUrl, { params: httpParams });
  }

  getCertificacion(id: string): Observable<CertificacionResponse> {
    return this.http.get<CertificacionResponse>(`${this.apiUrl}/${id}`);
  }

  createCertificacion(data: CreateCertificacionRequest): Observable<CertificacionResponse> {
    return this.http.post<CertificacionResponse>(this.apiUrl, data);
  }

  updateCertificacion(id: string, data: UpdateCertificacionRequest): Observable<CertificacionResponse> {
    return this.http.put<CertificacionResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteCertificacion(id: string): Observable<CertificacionResponse> {
    return this.http.delete<CertificacionResponse>(`${this.apiUrl}/${id}`);
  }

  bulkDelete(ids: string[]): Observable<CertificacionResponse> {
    return this.http.delete<CertificacionResponse>(`${this.apiUrl}/bulk_delete`, {
      body: { ids }
    });
  }
}
