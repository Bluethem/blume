export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  telefono?: string;
  direccion?: string;
  rol: 'paciente' | 'medico' | 'administrador';
  activo: boolean;
  es_super_admin?: boolean;
  ultimo_acceso?: string;
  creado_por_id?: string;
  foto_url?: string;
  created_at: string;
  updated_at?: string;
  paciente?: Paciente;
  medico?: {
    id: string;
    numero_colegiatura: string;
    anios_experiencia: number;
    calificacion_promedio: number;
    costo_consulta: number;
    biografia?: string;
    especialidad_principal?: string;
    especialidades: Array<{
      id: string;
      nombre: string;
      es_principal: boolean;
    }>;
  };
  admin?: {
    permisos: string[];
  };
}

export interface Paciente {
  id: string;
  usuario_id: string;
  fecha_nacimiento: string;
  edad: number;
  genero: 'masculino' | 'femenino' | 'otro';
  tipo_documento: 'dni' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  grupo_sanguineo?: string;
  alergias?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface Medico {
  id: string;
  nombre_completo: string;
  nombre_profesional: string;
  email: string;
  telefono: string;
  direccion?: string; // ✅ Ubicación del consultorio
  numero_colegiatura: string;
  anios_experiencia: number;
  costo_consulta: number;
  biografia?: string;
  activo: boolean;
  
  // ✅ NUEVO: Especialidades
  especialidad?: string; // Nombre de la especialidad principal (para compatibilidad)
  especialidad_principal?: {
    id: string;
    nombre: string;
  };
  especialidades: Array<{
    id: string;
    nombre: string;
    es_principal: boolean;
  }>;
  
  // Campos adicionales
  calificacion?: number;
  calificacion_promedio?: number;
  total_reviews?: number;
  total_resenas?: number;
  foto_url?: string;
  certificaciones?: string[];
  disponible_hoy?: boolean;
}

export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
  es_principal?: boolean; // ✅ NUEVO: para saber si es principal del médico
  created_at?: string;
  updated_at?: string;
}

export interface Certificacion {
  id: string;
  nombre: string;
  institucion_emisora: string;
  fecha_obtencion?: string;
  fecha_expiracion?: string;
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id: string;
  paciente_id: string;
  medico_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  motivo_consulta: string;
  observaciones?: string;
  diagnostico?: string;
  motivo_cancelacion?: string;
  cancelada_por_id?: string;
  costo: number;
  created_at: string;
  updated_at: string;
  
  // ✅ RELACIONES
  paciente?: {
    id: string;
    nombre_completo?: string;
    edad?: number;
    grupo_sanguineo?: string;
    alergias?: string | string[];
    email?: string;
    telefono?: string;
  };
  medico?: {
    id: string;
    nombre_completo?: string;
    nombre_profesional: string;
    numero_colegiatura: string;
    especialidad?: string;
    especialidades?: string[];
    direccion?: string;
    foto_url?: string;
  };
  
  // ✅ CAMPOS CALCULADOS
  duracion_minutos?: number;
  puede_cancelarse?: boolean;
  puede_confirmarse?: boolean;
  puede_completarse?: boolean;
  estado_label?: string;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  cita_id?: string;
  tipo: 'cita_creada' | 'cita_confirmada' | 'cita_cancelada' | 'recordatorio';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_leida?: string;
  created_at: string;
  updated_at: string;
  
  cita?: Cita;
  
  // ✅ CAMPOS CALCULADOS
  icono?: string;           // ✅ AGREGADO
  color?: string;
  hace_cuanto?: string;
  tiempo_relativo?: string; // ✅ AGREGADO
  url?: string;
}

// ✅ INTERFACES DE REQUEST/RESPONSE

export interface LoginRequest {
  auth: {
    email: string;
    password: string;
  };
}

export interface RegisterRequest {
  auth: {
    email: string;
    password: string;
    password_confirmation: string;
    nombre: string;
    apellido: string;
    telefono: string;
    direccion?: string;
  };
  paciente: { // ✅ CORREGIDO: ahora va nested en "paciente"
    fecha_nacimiento: string;
    genero: 'masculino' | 'femenino' | 'otro';
    tipo_documento: 'dni' | 'pasaporte' | 'carnet_extranjeria';
    numero_documento: string;
    grupo_sanguineo?: string;
    alergias?: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: Usuario;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: string[]; // ✅ AGREGADO: para múltiples errores
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  };
}

// ✅ NUEVO: Interfaces para horarios
export interface HorarioMedico {
  id: string;
  medico_id: string;
  dia_semana: number; // 0-6 (0=Domingo, 6=Sábado)
  dia_nombre: string;
  dia_abreviado: string;
  hora_inicio: string; // "09:00"
  hora_fin: string; // "13:00"
  duracion_cita_minutos: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlotHorario {
  hora_inicio: string;
  hora_fin: string;
  fecha_hora_inicio: string; // ISO format
  fecha_hora_fin: string; // ISO format
  disponible: boolean;
  duracion_minutos: number;
}

export interface HorariosDisponibles {
  fecha: string;
  dia_semana: string;
  dia_numero: number;
  disponible: boolean;
  total_slots: number;
  slots_disponibles: number;
  slots_ocupados: number;
  slots: SlotHorario[];
  mensaje?: string;
  medico?: {
    id: string;
    nombre_completo: string;
    nombre_profesional: string;
  };
}

// ✅ VALORACIONES/RESEÑAS
export interface Valoracion {
  id: string;
  paciente_id: string;
  medico_id: string;
  cita_id?: string;
  calificacion: number; // 1-5
  comentario?: string;
  anonimo: boolean;
  nombre_paciente: string;
  iniciales_paciente: string;
  fecha: string;
  fecha_formateada: string;
  created_at: string;
  updated_at: string;
}

export interface CreateValoracionRequest {
  valoracion: {
    calificacion: number;
    comentario?: string;
    anonimo?: boolean;
    cita_id?: string;
  };
}

export interface EstadisticasValoraciones {
  calificacion_promedio: number;
  total_valoraciones: number;
  distribucion: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ✅ Exportar modelos de dashboard de médico
export * from './dashboard.models';
export * from './medico-dashboard.models';
export * from './medico-citas.models';
export * from './agendar-cita.models';