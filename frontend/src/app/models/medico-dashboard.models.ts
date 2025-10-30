// Modelos para el dashboard de médicos
import type { CitaMedico } from './medico-citas.models';

// Re-exportar CitaMedico para que esté disponible
export type { CitaMedico };

export interface MedicoDashboardData {
  medico: {
    id: string;
    nombre_completo: string;
    nombre_profesional: string;
    numero_colegiatura: string;
    especialidad: string;
    foto_url?: string;
  };
  estadisticas: {
    citas_hoy: number;
    citas_completadas_hoy: number;
    total_pacientes_atendidos: number;
    proxima_cita_hora?: string;
  };
  citas_hoy: CitaMedico[];
  citas_proximas: CitaMedico[]; // Citas de la semana para el calendario
  pacientes_recientes: PacienteReciente[];
  calendario_semanal?: any; // Para futuras implementaciones
}

export interface PacienteReciente {
  id: string;
  nombre_completo: string;
  foto_url?: string;
  ultima_cita: string;
  ultima_cita_fecha: string;
  total_citas?: number;
}
