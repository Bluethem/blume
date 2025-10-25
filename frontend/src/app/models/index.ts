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
  paciente?: Paciente;
  medico?: Medico;
}

export interface Paciente {
  id: string;
  fecha_nacimiento: string;
  edad: number;
  genero: 'masculino' | 'femenino' | 'otro';
  tipo_documento: 'dni' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  grupo_sanguineo?: string;
  alergias?: string;
}

export interface Medico {
  id: string;
  numero_colegiatura: string;
  anos_experiencia: number;
  calificacion_promedio: number;
  tarifa_consulta: number;
  biografia?: string;
  especialidades: Especialidad[];
}

export interface Especialidad {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Cita {
  id: string;
  paciente: {
    id: string;
    nombre_completo: string;
    email: string;
    telefono: string;
  };
  medico: {
    id: string;
    nombre_completo: string;
    numero_colegiatura: string;
    especialidades: string[];
  };
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo_consulta: string;
  diagnostico?: string;
  observaciones?: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  costo: number;
  motivo_cancelacion?: string;
  created_at: string;
  updated_at: string;
}

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

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
  fecha_nacimiento: string;
  genero: 'masculino' | 'femenino' | 'otro';
  tipo_documento: 'dni' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  rol?: string;
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
  details?: string[];
}