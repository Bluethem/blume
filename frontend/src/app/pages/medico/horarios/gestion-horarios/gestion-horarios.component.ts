import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface HorarioBloque {
  id?: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_cita_minutos: number;
  activo: boolean;
  // Propiedades calculadas para UI
  fila_inicio?: number;
  filas_span?: number;
  tiene_conflicto?: boolean;
}

interface CitaCalendario {
  id: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  motivo_consulta: string;
  paciente: {
    nombre_completo: string;
  };
  // Propiedades calculadas para UI
  dia_semana?: number;
  fila_inicio?: number;
  filas_span?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-gestion-horarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-horarios.component.html',
  styleUrls: ['./gestion-horarios.component.css']
})
export class GestionHorariosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  horarios: HorarioBloque[] = [];
  citas: CitaCalendario[] = [];
  loading = false;
  
  // Filtro de semana
  semanaActual = new Date();
  
  // Modal
  modalAbierto = false;
  editando = false;
  horarioEditando: HorarioBloque | null = null;
  
  form: FormGroup;
  guardando = false;

  // Días de la semana
  diasSemana = [
    { valor: 1, nombre: 'Lunes', abrev: 'L' },
    { valor: 2, nombre: 'Martes', abrev: 'M' },
    { valor: 3, nombre: 'Miércoles', abrev: 'X' },
    { valor: 4, nombre: 'Jueves', abrev: 'J' },
    { valor: 5, nombre: 'Viernes', abrev: 'V' },
    { valor: 6, nombre: 'Sábado', abrev: 'S' },
    { valor: 0, nombre: 'Domingo', abrev: 'D' }
  ];

  // Horas del día (0-23)
  horas = Array.from({ length: 24 }, (_, i) => i);

  constructor() {
    this.form = this.fb.group({
      dias_seleccionados: [[], Validators.required],
      hora_inicio: ['09:00', Validators.required],
      hora_fin: ['13:00', Validators.required],
      duracion_cita_minutos: [30, Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarHorarios();
    this.cargarCitas();
  }

  cargarHorarios(): void {
    this.loading = true;
    this.http.get<ApiResponse<HorarioBloque[]>>(`${this.apiUrl}/medico/horarios`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.horarios = response.data.map(h => this.calcularPosicionBloque(h));
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cargarCitas(): void {
    // Obtener citas de la semana actual
    const inicio = this.obtenerInicioSemana(this.semanaActual);
    const fin = this.obtenerFinSemana(this.semanaActual);
    
    this.http.get<ApiResponse<any>>(`${this.apiUrl}/medico/citas`, {
      params: {
        fecha_desde: inicio.toISOString().split('T')[0],
        fecha_hasta: fin.toISOString().split('T')[0]
      }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.citas = response.data.citas.map((c: any) => this.calcularPosicionCita(c));
        }
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
      }
    });
  }

  obtenerInicioSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    return new Date(d.setDate(diff));
  }

  obtenerFinSemana(fecha: Date): Date {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Domingo
    return new Date(d.setDate(diff));
  }

  calcularPosicionCita(cita: any): CitaCalendario {
    const fechaInicio = new Date(cita.fecha_hora_inicio);
    const fechaFin = new Date(cita.fecha_hora_fin);
    
    // Día de la semana (0=Domingo, 1=Lunes, etc.)
    let diaSemana = fechaInicio.getDay();
    
    // Hora de inicio
    const horaInicio = fechaInicio.getHours() + fechaInicio.getMinutes() / 60;
    
    // Duración en horas
    const duracion = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
    
    return {
      ...cita,
      dia_semana: diaSemana,
      fila_inicio: Math.floor(horaInicio) + 1,
      filas_span: Math.ceil(duracion)
    };
  }

  calcularPosicionBloque(horario: HorarioBloque): HorarioBloque {
    // Convertir hora de inicio a fila (cada hora = 1 fila, comenzando en 0)
    const [horaInicio] = horario.hora_inicio.split(':').map(Number);
    const [horaFin] = horario.hora_fin.split(':').map(Number);
    
    horario.fila_inicio = horaInicio + 1; // +1 porque la fila 1 es el header
    horario.filas_span = horaFin - horaInicio;
    
    // Detectar conflictos
    horario.tiene_conflicto = this.tieneConflicto(horario);
    
    return horario;
  }

  tieneConflicto(horario: HorarioBloque): boolean {
    return this.horarios.some(h => 
      h.id !== horario.id &&
      h.dia_semana === horario.dia_semana &&
      h.activo &&
      horario.activo &&
      this.horariosSeSuperponen(h, horario)
    );
  }

  horariosSeSuperponen(h1: HorarioBloque, h2: HorarioBloque): boolean {
    const inicio1 = this.horaAMinutos(h1.hora_inicio);
    const fin1 = this.horaAMinutos(h1.hora_fin);
    const inicio2 = this.horaAMinutos(h2.hora_inicio);
    const fin2 = this.horaAMinutos(h2.hora_fin);
    
    return (inicio1 < fin2 && fin1 > inicio2);
  }

  horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  obtenerHorariosPorDia(dia: number): HorarioBloque[] {
    return this.horarios.filter(h => h.dia_semana === dia);
  }

  obtenerCitasPorDia(dia: number): CitaCalendario[] {
    return this.citas.filter(c => c.dia_semana === dia);
  }

  getEstadoCitaClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'confirmada': 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
      'pendiente': 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500',
      'completada': 'bg-green-100 dark:bg-green-900/30 border-green-500',
      'cancelada': 'bg-gray-100 dark:bg-gray-700 border-gray-400'
    };
    return clases[estado] || clases['pendiente'];
  }

  getEstadoCitaTextClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'confirmada': 'text-blue-700 dark:text-blue-300',
      'pendiente': 'text-yellow-700 dark:text-yellow-300',
      'completada': 'text-green-700 dark:text-green-300',
      'cancelada': 'text-gray-500 dark:text-gray-400'
    };
    return clases[estado] || clases['pendiente'];
  }

  verDetalleCita(citaId: string): void {
    // Navegar a detalle de cita (implementar según sea necesario)
    window.open(`/medico/citas/detalle/${citaId}`, '_blank');
  }

  abrirModal(): void {
    this.editando = false;
    this.horarioEditando = null;
    this.form.reset({
      dias_seleccionados: [],
      hora_inicio: '09:00',
      hora_fin: '13:00',
      duracion_cita_minutos: 30,
      activo: true
    });
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.editando = false;
    this.horarioEditando = null;
  }

  editarHorario(horario: HorarioBloque): void {
    this.editando = true;
    this.horarioEditando = horario;
    this.form.patchValue({
      dias_seleccionados: [horario.dia_semana],
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      duracion_cita_minutos: horario.duracion_cita_minutos,
      activo: horario.activo
    });
    this.modalAbierto = true;
  }

  toggleDia(dia: number): void {
    const dias: number[] = this.form.value.dias_seleccionados || [];
    const index = dias.indexOf(dia);
    
    if (index > -1) {
      dias.splice(index, 1);
    } else {
      dias.push(dia);
    }
    
    this.form.patchValue({ dias_seleccionados: dias });
  }

  isDiaSeleccionado(dia: number): boolean {
    const dias: number[] = this.form.value.dias_seleccionados || [];
    return dias.includes(dia);
  }

  guardarHorario(): void {
    if (this.form.invalid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const datos = this.form.value;
    
    if (this.editando && this.horarioEditando) {
      // Actualizar horario existente
      this.actualizarHorario(this.horarioEditando.id!, datos);
    } else {
      // Crear nuevos horarios (uno por cada día seleccionado)
      this.crearHorarios(datos);
    }
  }

  crearHorarios(datos: any): void {
    this.guardando = true;
    
    const promesas = datos.dias_seleccionados.map((dia: number) => {
      const horario = {
        dia_semana: dia,
        hora_inicio: datos.hora_inicio,
        hora_fin: datos.hora_fin,
        duracion_cita_minutos: datos.duracion_cita_minutos,
        activo: datos.activo
      };
      
      return this.http.post<ApiResponse<HorarioBloque>>(`${this.apiUrl}/medico/horarios`, { horario }).toPromise();
    });

    Promise.all(promesas).then(() => {
      this.guardando = false;
      this.cerrarModal();
      this.cargarHorarios();
    }).catch((error) => {
      this.guardando = false;
      alert('Error al crear horarios: ' + (error.error?.message || 'Error desconocido'));
    });
  }

  actualizarHorario(id: string, datos: any): void {
    this.guardando = true;
    
    const horario = {
      dia_semana: datos.dias_seleccionados[0],
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      duracion_cita_minutos: datos.duracion_cita_minutos,
      activo: datos.activo
    };

    this.http.put<ApiResponse<HorarioBloque>>(`${this.apiUrl}/medico/horarios/${id}`, { horario }).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.cargarHorarios();
      },
      error: (error) => {
        this.guardando = false;
        alert('Error al actualizar horario: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  eliminarHorario(horario: HorarioBloque): void {
    if (!confirm('¿Está seguro de eliminar este horario?')) {
      return;
    }

    this.http.delete<ApiResponse<any>>(`${this.apiUrl}/medico/horarios/${horario.id}`).subscribe({
      next: () => {
        this.cargarHorarios();
      },
      error: (error) => {
        alert('Error al eliminar horario: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  toggleActivo(horario: HorarioBloque): void {
    horario.activo = !horario.activo;
    
    this.http.put<ApiResponse<HorarioBloque>>(`${this.apiUrl}/medico/horarios/${horario.id}`, {
      horario: { activo: horario.activo }
    }).subscribe({
      next: () => {
        this.cargarHorarios();
      },
      error: (error) => {
        horario.activo = !horario.activo; // Revertir
        alert('Error al actualizar estado: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  calcularCapacidadEstimada(): number {
    const datos = this.form.value;
    if (!datos.hora_inicio || !datos.hora_fin || !datos.duracion_cita_minutos) {
      return 0;
    }

    const minutos = this.horaAMinutos(datos.hora_fin) - this.horaAMinutos(datos.hora_inicio);
    return Math.floor(minutos / datos.duracion_cita_minutos);
  }

  // Opciones para los selects
  getHorasDisponibles(): string[] {
    const horas = [];
    for (let i = 0; i < 24; i++) {
      horas.push(`${i.toString().padStart(2, '0')}:00`);
      horas.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return horas;
  }

  getDuracionesDisponibles(): number[] {
    return [15, 30, 45, 60];
  }
}
