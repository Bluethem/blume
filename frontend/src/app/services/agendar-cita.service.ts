import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  PacienteBusqueda, 
  RegistroPacienteRapido, 
  AgendarCitaData,
  SlotDisponible
} from '../models/agendar-cita.models';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AgendarCitaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Buscar pacientes existentes
   */
  buscarPacientes(termino: string): Observable<ApiResponse<PacienteBusqueda[]>> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<ApiResponse<PacienteBusqueda[]>>(`${this.apiUrl}/medico/pacientes/buscar`, { params });
  }

  /**
   * Registrar nuevo paciente (registro rápido)
   */
  registrarPacienteRapido(data: RegistroPacienteRapido): Observable<ApiResponse<PacienteBusqueda>> {
    return this.http.post<ApiResponse<PacienteBusqueda>>(`${this.apiUrl}/medico/pacientes`, { paciente: data });
  }

  /**
   * Obtener slots disponibles para una fecha
   */
  obtenerSlotsDisponibles(fecha: string): Observable<ApiResponse<SlotDisponible[]>> {
    const params = new HttpParams().set('fecha', fecha);
    return this.http.get<ApiResponse<SlotDisponible[]>>(`${this.apiUrl}/medico/horarios/disponibles`, { params });
  }

  /**
   * Agendar nueva cita
   */
  agendarCita(data: AgendarCitaData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/medico/citas`, { cita: data });
  }
}
