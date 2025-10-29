import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface Perfil {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: string;
  foto_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/perfil`;

  /**
   * Obtener perfil del usuario actual
   */
  getPerfil(): Observable<ApiResponse<Perfil>> {
    return this.http.get<ApiResponse<Perfil>>(this.apiUrl);
  }

  /**
   * Actualizar perfil del usuario
   */
  updatePerfil(data: Partial<Perfil>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(this.apiUrl, { usuario: data });
  }

  /**
   * Subir foto de perfil
   */
  uploadFoto(file: File): Observable<ApiResponse<{ foto_url: string }>> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<ApiResponse<{ foto_url: string }>>(
      `${this.apiUrl}/upload_foto`,
      formData
    );
  }
}
