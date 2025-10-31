import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Administrador {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  direccion?: string;
  es_super_admin: boolean;
  rol_display: string;
  activo: boolean;
  foto_url?: string;
  ultimo_acceso?: string;
  created_at: string;
  puede_editar: boolean;
  puede_eliminar: boolean;
  puede_desactivar: boolean;
}

export interface AdministradorDetalle extends Administrador {
  creado_por?: {
    id: string;
    nombre_completo: string;
  };
  updated_at: string;
}

export interface CreateAdministradorRequest {
  administrador: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    direccion?: string;
    password: string;
    password_confirmation: string;
    activo?: boolean;
  };
}

export interface UpdateAdministradorRequest {
  administrador: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    password?: string;
    password_confirmation?: string;
    activo?: boolean;
  };
}

export interface AdministradoresResponse {
  success: boolean;
  data?: {
    administradores: Administrador[];
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

export interface AdministradorResponse {
  success: boolean;
  data?: AdministradorDetalle;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminAdministradoresService {
  private apiUrl = `${environment.apiUrl}/admin/administradores`;

  constructor(private http: HttpClient) {}

  getAdministradores(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    rol?: 'super_admin' | 'admin';
  }): Observable<AdministradoresResponse> {
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
    if (params?.rol) {
      httpParams = httpParams.set('rol', params.rol);
    }

    return this.http.get<AdministradoresResponse>(this.apiUrl, { params: httpParams });
  }

  getAdministrador(id: string): Observable<AdministradorResponse> {
    return this.http.get<AdministradorResponse>(`${this.apiUrl}/${id}`);
  }

  createAdministrador(data: CreateAdministradorRequest): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(this.apiUrl, data);
  }

  updateAdministrador(id: string, data: UpdateAdministradorRequest): Observable<AdministradorResponse> {
    return this.http.put<AdministradorResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteAdministrador(id: string): Observable<AdministradorResponse> {
    return this.http.delete<AdministradorResponse>(`${this.apiUrl}/${id}`);
  }

  toggleEstado(id: string): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(`${this.apiUrl}/${id}/toggle_estado`, {});
  }

  bulkAction(action: 'activate' | 'deactivate' | 'delete', ids: string[]): Observable<AdministradorResponse> {
    return this.http.post<AdministradorResponse>(`${this.apiUrl}/bulk_action`, {
      action_type: action,
      ids: ids
    });
  }
}
