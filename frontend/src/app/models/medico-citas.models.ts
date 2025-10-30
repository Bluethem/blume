// Modelos para las citas del médico
export interface CitaMedico {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: EstadoCita;
  motivo_consulta?: string;
  diagnostico?: string;
  observaciones?: string;
  receta?: string;
  paciente?: {
    id: string;
    nombre_completo: string;
    foto_url?: string;
    edad?: number;
    telefono?: string;
  };
  paciente_nombre?: string; // Para datos simplificados del calendario
  paciente_id?: string; // Para datos simplificados del calendario
  created_at?: string;
  updated_at?: string;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';

export interface FiltrosCitas {
  estado?: EstadoCita | 'todas' | 'proximas' | 'completadas' | 'canceladas';
  fecha_desde?: string;
  fecha_hasta?: string;
  busqueda?: string;
  page?: number;
  per_page?: number;
}

export interface CitasResponse {
  citas: CitaMedico[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  estadisticas?: {
    todas: number;
    proximas: number;
    completadas: number;
    canceladas: number;
    pendientes: number;
  };
}

export interface CompletarCitaRequest {
  diagnostico: string;
  observaciones?: string;
  receta?: string;
}

export interface CancelarCitaRequest {
  motivo_cancelacion: string;
}
