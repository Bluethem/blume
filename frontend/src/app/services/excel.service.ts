// services/excel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * MÉDICO - Exportar estadísticas a Excel
   */
  exportarEstadisticasMedico(fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get(`${this.apiUrl}/medico/estadisticas/exportar`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    });
  }

  /**
   * ADMIN - Exportar listado de médicos a Excel
   */
  exportarMedicos(filtros?: any): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.search) params = params.set('search', filtros.search);
      if (filtros.especialidad_id) params = params.set('especialidad_id', filtros.especialidad_id);
      if (filtros.activo !== undefined) params = params.set('activo', filtros.activo.toString());
    }

    return this.http.get(`${this.apiUrl}/admin/medicos/exportar_excel`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    });
  }

  /**
   * ADMIN - Exportar listado de pacientes a Excel
   */
  exportarPacientes(filtros?: any): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.search) params = params.set('search', filtros.search);
      if (filtros.activo !== undefined) params = params.set('activo', filtros.activo.toString());
    }

    return this.http.get(`${this.apiUrl}/admin/pacientes/exportar_excel`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    });
  }

  /**
   * ADMIN - Exportar reportes a Excel
   */
  exportarReportes(tipo: string, fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('tipo', tipo);
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get(`${this.apiUrl}/admin/reportes/exportar_excel`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    });
  }

  /**
   * Helper para descargar archivo Excel en el navegador
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    // Asegurar extensión .xlsx
    if (!nombreArchivo.endsWith('.xlsx')) {
      nombreArchivo += '.xlsx';
    }

    // Crear URL temporal
    const url = window.URL.createObjectURL(blob);
    
    // Crear link temporal
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    
    // Trigger descarga
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
