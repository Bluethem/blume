// services/pdf.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = `${environment.apiUrl}/paciente/citas`;

  constructor(private http: HttpClient) {}

  /**
   * Descargar PDF de resumen de cita individual
   */
  descargarResumenCita(citaId: string): Observable<Blob> {
    const url = `${this.apiUrl}/${citaId}/descargar_pdf`;
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * Descargar PDF de historial médico completo
   */
  descargarHistorialMedico(): Observable<Blob> {
    const url = `${this.apiUrl}/descargar_historial_pdf`;
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * MÉDICO - Descargar PDF de resumen de cita
   */
  descargarResumenCitaMedico(citaId: string): Observable<Blob> {
    const url = `${environment.apiUrl}/medico/citas/${citaId}/descargar_pdf`;
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * ADMIN - Exportar reportes a PDF
   */
  exportarReportesPdf(fechaInicio?: string, fechaFin?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get(`${environment.apiUrl}/admin/reportes/exportar_pdf`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }

  /**
   * Helper para descargar el archivo PDF en el navegador
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
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
