// Modelos para agendar citas
export interface PacienteBusqueda {
  id: string;
  nombre_completo: string;
  numero_documento: string;
  foto_url?: string;
  telefono?: string;
  edad?: number;
}

export interface RegistroPacienteRapido {
  tipo_documento: 'dni' | 'pasaporte' | 'carnet_extranjeria';
  numero_documento: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  genero: 'masculino' | 'femenino' | 'otro';
  telefono: string;
  email?: string;
  grupo_sanguineo?: string;
  alergias?: string;
}

export interface HorarioDisponible {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export interface AgendarCitaData {
  paciente_id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  motivo_consulta: string;
  observaciones?: string;
  costo?: number;
}

export interface SlotDisponible {
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export interface DiaCalendario {
  fecha: string;
  dia_semana: number;
  slots: SlotDisponible[];
}
