// src/app/core/models/reprogramacion.model.ts

export enum MotivoReprogramacion {
  PACIENTE_NO_ASISTIO = 'paciente_no_asistio',
  MEDICO_NO_ASISTIO = 'medico_no_asistio',
  EMERGENCIA_MEDICA = 'emergencia_medica',
  SOLICITUD_PACIENTE = 'solicitud_paciente',
  ERROR_PROGRAMACION = 'error_programacion'
}

export enum EstadoReprogramacion {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada'
}

export interface CitaReprogramacion {
  id: string;
  fecha: string;
  medico?: string;
  paciente?: string;
  costo?: number;
  pagado?: boolean;
  estado?: string;
}

export interface SolicitadoPor {
  nombre: string;
  rol: string;
  id?: string;
}

export interface AprobadoPor {
  nombre: string;
  rol: string;
}

export interface Reprogramacion {
  id: string;
  motivo: MotivoReprogramacion;
  motivo_label: string;
  estado: EstadoReprogramacion;
  estado_label: string;
  descripcion: string;
  fechas_propuestas: string[];
  fecha_seleccionada: string | null;
  requiere_reembolso: boolean;
  reembolso_procesado: boolean;
  created_at: string;
  cita_original: CitaReprogramacion;
  solicitado_por?: SolicitadoPor;
}

export interface ReprogramacionDetallada extends Reprogramacion {
  justificacion: string;
  fecha_aprobacion: string | null;
  fecha_rechazo: string | null;
  motivo_rechazo: string | null;
  metadata: any;
  cita_nueva: CitaReprogramacion | null;
  aprobado_por: AprobadoPor | null;
}

export interface SolicitarReprogramacionRequest {
  cita_id: string;
  motivo: MotivoReprogramacion;
  descripcion: string;
  justificacion: string;
  fecha_propuesta_1: string;
  fecha_propuesta_2?: string;
  fecha_propuesta_3?: string;
}

export interface AprobarReprogramacionRequest {
  fecha_seleccionada: string;
  crear_cita_nueva?: boolean;
}

export interface RechazarReprogramacionRequest {
  motivo_rechazo: string;
}

export interface ReprogramacionesResponse {
  reprogramaciones: Reprogramacion[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface RegistrarFaltaRequest {
  cita_id: string;
  quien_falta: 'paciente' | 'medico';
  motivo?: string;
}

// Labels y colores
export const MOTIVOS_REPROGRAMACION_LABELS: { [key in MotivoReprogramacion]: string } = {
  [MotivoReprogramacion.PACIENTE_NO_ASISTIO]: 'Paciente no asistió',
  [MotivoReprogramacion.MEDICO_NO_ASISTIO]: 'Médico no asistió',
  [MotivoReprogramacion.EMERGENCIA_MEDICA]: 'Emergencia médica',
  [MotivoReprogramacion.SOLICITUD_PACIENTE]: 'Solicitud del paciente',
  [MotivoReprogramacion.ERROR_PROGRAMACION]: 'Error de programación'
};

export const ESTADOS_REPROGRAMACION_LABELS: { [key in EstadoReprogramacion]: string } = {
  [EstadoReprogramacion.PENDIENTE]: 'Pendiente',
  [EstadoReprogramacion.APROBADA]: 'Aprobada',
  [EstadoReprogramacion.RECHAZADA]: 'Rechazada',
  [EstadoReprogramacion.COMPLETADA]: 'Completada',
  [EstadoReprogramacion.CANCELADA]: 'Cancelada'
};

export const ESTADOS_REPROGRAMACION_COLORS: { [key in EstadoReprogramacion]: string } = {
  [EstadoReprogramacion.PENDIENTE]: 'warning',
  [EstadoReprogramacion.APROBADA]: 'success',
  [EstadoReprogramacion.RECHAZADA]: 'danger',
  [EstadoReprogramacion.COMPLETADA]: 'info',
  [EstadoReprogramacion.CANCELADA]: 'secondary'
};

export const MOTIVOS_REPROGRAMACION_ICONS: { [key in MotivoReprogramacion]: string } = {
  [MotivoReprogramacion.PACIENTE_NO_ASISTIO]: 'bi-person-x',
  [MotivoReprogramacion.MEDICO_NO_ASISTIO]: 'bi-hospital',
  [MotivoReprogramacion.EMERGENCIA_MEDICA]: 'bi-exclamation-triangle',
  [MotivoReprogramacion.SOLICITUD_PACIENTE]: 'bi-calendar2-check',
  [MotivoReprogramacion.ERROR_PROGRAMACION]: 'bi-exclamation-circle'
};
