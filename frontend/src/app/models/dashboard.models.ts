
export interface Paciente {
  id: string;
  nombre_completo: string;
  edad: number;
  genero: string;
  email: string;
  telefono: string;
  direccion: string;
  fecha_nacimiento: string;
  tipo_documento: string;
  numero_documento: string;
  grupo_sanguineo?: string;
  alergias?: string;
}

export interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
  anos_experiencia: number;
  costo_consulta: number;
  biografia?: string;
  calificacion: number;
  total_reviews: number;
  foto_url?: string;
  disponible_hoy?: boolean;
  telefono?: string;
  email?: string;
  direccion?: string;
  numero_colegiatura?: string;
  certificaciones?: Certificacion[];
  horarios_atencion?: HorarioAtencion[];
  total_pacientes_atendidos?: number;
  total_citas_completadas?: number;
}

export interface Cita {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_asistio';
  estado_label: string;
  motivo_consulta: string;
  observaciones?: string;
  diagnostico?: string;
  costo: number;
  puede_cancelar: boolean;
  medico: {
    id: string;
    nombre_completo: string;
    especialidad: string;
    foto_url?: string;
    telefono?: string;
    direccion?: string;
  };
  dias_restantes?: number;
  duracion_minutos?: number;
  motivo_cancelacion?: string;
  created_at: string;
  updated_at?: string;
}

export interface Estadisticas {
  total_citas: number;
  citas_pendientes: number;
  citas_completadas: number;
  citas_canceladas: number;
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  tiempo_relativo: string;
  icono: string;
  color: string;
  cita_id?: string;
  fecha_leida?: string;
}

export interface Certificacion {
  id: string;
  nombre: string;
  institucion: string;
}

export interface HorarioAtencion {
  dia: string;
  horarios: string[];
}

export interface HorarioDisponible {
  fecha: string;
  dia_semana: string;
  disponible: boolean;
  horarios: SlotHorario[];
  duracion_cita?: number;
}

export interface SlotHorario {
  fecha_hora: string;
  hora_display: string;
  disponible: boolean;
}

export interface DashboardData {
  paciente: Paciente;
  proxima_cita: Cita | null;
  estadisticas: Estadisticas;
  medicos_disponibles: Medico[];
  notificaciones_recientes: Notificacion[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}