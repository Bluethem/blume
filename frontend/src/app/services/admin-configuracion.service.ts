import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Configuracion {
  id: string;
  clave: string;
  valor: any;
  descripcion: string;
  categoria: string;
  solo_super_admin: boolean;
  puede_modificar: boolean;
}

export interface ConfiguracionResponse {
  success: boolean;
  data?: {
    configuraciones: Configuracion[];
    por_categoria: { [key: string]: Configuracion[] };
    es_super_admin: boolean;
  };
  message?: string;
  errors?: string[];
}

export interface ConfiguracionSingleResponse {
  success: boolean;
  data?: Configuracion;
  message?: string;
  errors?: string[];
}

export interface BatchUpdateRequest {
  configuraciones: Array<{
    clave: string;
    valor: any;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConfiguracionService {
  private apiUrl = `${environment.apiUrl}/admin/configuracion`;

  constructor(private http: HttpClient) {}

  getConfiguraciones(categoria?: string): Observable<ConfiguracionResponse> {
    let params = new HttpParams();
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    return this.http.get<ConfiguracionResponse>(this.apiUrl, { params });
  }

  getConfiguracion(clave: string): Observable<ConfiguracionSingleResponse> {
    return this.http.get<ConfiguracionSingleResponse>(`${this.apiUrl}/${clave}`);
  }

  updateConfiguracion(clave: string, valor: any): Observable<ConfiguracionSingleResponse> {
    return this.http.put<ConfiguracionSingleResponse>(`${this.apiUrl}/${clave}`, { valor });
  }

  batchUpdate(data: BatchUpdateRequest): Observable<ConfiguracionResponse> {
    return this.http.put<ConfiguracionResponse>(`${this.apiUrl}/batch_update`, data);
  }

  restablecer(categoria: string): Observable<ConfiguracionResponse> {
    return this.http.post<ConfiguracionResponse>(`${this.apiUrl}/restablecer`, { categoria });
  }
}
