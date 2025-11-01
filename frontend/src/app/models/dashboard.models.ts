// src/app/models/dashboard.models.ts
export interface DashboardData {
  paciente: {
    id: string;
    nombre_completo: string;
    email: string;
    fecha_nacimiento: string;
    edad: number;
  };
  estadisticas: {
    total_citas: number;
    citas_pendientes: number;
    citas_completadas: number;
    citas_canceladas: number;
  };
  proxima_cita: Cita | null;
  medicos_disponibles: Medico[];
  notificaciones_recientes: Notificacion[];
}

export interface Cita {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta: string;
  costo: number;
  estado_label?: string; // ✅ AGREGADO
  medico: {
    id: string;
    nombre_completo: string;
    nombre_profesional: string;
    especialidad: string;
    foto_url?: string;
    direccion?: string; // 
  };
}

export interface Medico {
  id: string;
  nombre_completo: string;
  nombre_profesional: string;
  numero_colegiatura: string;
  anios_experiencia: number;
  costo_consulta: number;
  biografia?: string;
  direccion?: string; // ✅ Ubicación del consultorio
  especialidad: string;
  especialidad_principal?: {
    id: string;
    nombre: string;
  };
  especialidades: Array<{
    id: string;
    nombre: string;
  }>;
  calificacion?: number;
  calificacion_promedio?: number;
  foto_url?: string;
  disponible_hoy?: boolean;
  total_reviews?: number;
  total_resenas?: number;
}

export interface Notificacion {
  id: string;
  tipo: 'cita_creada' | 'cita_confirmada' | 'cita_cancelada' | 'recordatorio';
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  cita?: {
    id: string;
    fecha_hora_inicio: string;
  };
}