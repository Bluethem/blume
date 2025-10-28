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
  created_at: string;
  updated_at?: string;
  paciente?: Paciente;
  medico?: Medico;
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
  usuario_id: string;
  numero_colegiatura: string;
  anios_experiencia: number; // ✅ CORREGIDO: cambiar "anos" por "anios" si lo usas
  costo_consulta: number; // ✅ CORREGIDO: era "tarifa_consulta"
  biografia?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  
  // ✅ NUEVO: Relaciones
  especialidad_principal?: Especialidad;
  especialidades: Especialidad[];
  certificaciones?: Certificacion[];
  
  // ✅ CAMPOS CALCULADOS (desde el backend)
  nombre_completo?: string;
  nombre_profesional?: string;
  email?: string;
  telefono?: string;
  calificacion_promedio?: number; // Para futuro
  disponible_hoy?: boolean;
  foto_url?: string;
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
    nombre_completo: string;
    email: string;
    telefono: string;
  };
  medico?: {
    id: string;
    nombre_completo: string;
    nombre_profesional: string;
    numero_colegiatura: string;
    especialidad?: string;
    especialidades?: string[];
    direccion?: string;  // ✅ AGREGADO
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