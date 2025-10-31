import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PerfilAdmin {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  email: string;
  telefono?: string;
  direccion?: string;
  foto_url?: string;
  rol: string;
  rol_display: string;
  es_super_admin: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PerfilResponse {
  success: boolean;
  data?: PerfilAdmin;
  message?: string;
  errors?: string[];
}

export interface UpdatePerfilRequest {
  perfil: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
}

export interface CambiarPasswordRequest {
  password_actual: string;
  password_nuevo: string;
  password_confirmacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminPerfilService {
  private apiUrl = `${environment.apiUrl}/admin/perfil`;

  constructor(private http: HttpClient) {}

  getPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.apiUrl);
  }

  updatePerfil(data: UpdatePerfilRequest): Observable<PerfilResponse> {
    return this.http.put<PerfilResponse>(this.apiUrl, data);
  }

  cambiarPassword(data: CambiarPasswordRequest): Observable<PerfilResponse> {
    return this.http.put<PerfilResponse>(`${this.apiUrl}/cambiar_password`, data);
  }

  subirFoto(file: File): Observable<PerfilResponse> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<PerfilResponse>(`${this.apiUrl}/foto`, formData);
  }
}
