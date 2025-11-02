// src/app/core/models/pago.model.ts

export enum TipoPago {
  PAGO_CONSULTA = 'pago_consulta',
  PAGO_ADICIONAL = 'pago_adicional',
  REEMBOLSO = 'reembolso'
}

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  COMPLETADO = 'completado',
  FALLIDO = 'fallido',
  REEMBOLSADO = 'reembolsado',
  CANCELADO = 'cancelado'
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  YAPE = 'yape',
  PLIN = 'plin',
  OTRO = 'otro'
}

export interface CitaPago {
  id: string;
  fecha: string;
  medico: string;
  especialidad?: string;
}

export interface Pago {
  id: string;
  monto: number;
  tipo_pago: TipoPago;
  estado: EstadoPago;
  metodo_pago: MetodoPago;
  concepto: string;
  descripcion: string;
  transaction_id: string | null;
  fecha_pago: string | null;
  created_at: string;
  cita: CitaPago;
}

export interface PagoDetallado extends Pago {
  metadata?: any;
  fecha_reembolso: string | null;
  payment_gateway: string | null;
  updated_at: string;
}

export interface CrearPagoRequest {
  cita_id: string;
  metodo_pago: MetodoPago;
}

export interface PagosResponse {
  pagos: Pago[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface EstadisticasPagos {
  total_pagado: number;
  total_pendiente: number;
  cantidad_pagos: number;
  ultimo_pago: string | null;
  metodos_usados: { [key: string]: number };
}

// Helpers
export const METODOS_PAGO_LABELS: { [key in MetodoPago]: string } = {
  [MetodoPago.EFECTIVO]: 'Efectivo',
  [MetodoPago.TARJETA]: 'Tarjeta',
  [MetodoPago.TRANSFERENCIA]: 'Transferencia',
  [MetodoPago.YAPE]: 'Yape',
  [MetodoPago.PLIN]: 'Plin',
  [MetodoPago.OTRO]: 'Otro'
};

export const ESTADOS_PAGO_LABELS: { [key in EstadoPago]: string } = {
  [EstadoPago.PENDIENTE]: 'Pendiente',
  [EstadoPago.PROCESANDO]: 'Procesando',
  [EstadoPago.COMPLETADO]: 'Completado',
  [EstadoPago.FALLIDO]: 'Fallido',
  [EstadoPago.REEMBOLSADO]: 'Reembolsado',
  [EstadoPago.CANCELADO]: 'Cancelado'
};

export const ESTADOS_PAGO_COLORS: { [key in EstadoPago]: string } = {
  [EstadoPago.PENDIENTE]: 'warning',
  [EstadoPago.PROCESANDO]: 'info',
  [EstadoPago.COMPLETADO]: 'success',
  [EstadoPago.FALLIDO]: 'danger',
  [EstadoPago.REEMBOLSADO]: 'secondary',
  [EstadoPago.CANCELADO]: 'dark'
};

export const METODOS_PAGO_ICONS: { [key in MetodoPago]: string } = {
  [MetodoPago.EFECTIVO]: 'bi-cash',
  [MetodoPago.TARJETA]: 'bi-credit-card',
  [MetodoPago.TRANSFERENCIA]: 'bi-bank',
  [MetodoPago.YAPE]: 'bi-phone',
  [MetodoPago.PLIN]: 'bi-phone-fill',
  [MetodoPago.OTRO]: 'bi-wallet2'
};
