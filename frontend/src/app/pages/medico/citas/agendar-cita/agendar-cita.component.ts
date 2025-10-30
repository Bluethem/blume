import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgendarCitaService } from '../../../../services/agendar-cita.service';
import { 
  PacienteBusqueda, 
  RegistroPacienteRapido, 
  AgendarCitaData,
  SlotDisponible 
} from '../../../../models/agendar-cita.models';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.css']
})
export class AgendarCitaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private agendarService = inject(AgendarCitaService);

  // Estado del wizard
  pasoActual = 1;
  
  // Datos de los pasos
  pacienteSeleccionado: PacienteBusqueda | null = null;
  fechaSeleccionada: string = '';
  slotSeleccionado: SlotDisponible | null = null;
  
  // Listas
  pacientes: PacienteBusqueda[] = [];
  slotsDisponibles: SlotDisponible[] = [];
  
  // Estados UI
  buscandoPacientes = false;
  mostrarFormularioNuevo = false;
  registrandoPaciente = false;
  cargandoSlots = false;
  agendando = false;
  
  // Búsqueda
  terminoBusqueda = '';
  
  // Formularios
  formNuevoPaciente: FormGroup;
  formDetallesCita: FormGroup;

  constructor() {
    this.formNuevoPaciente = this.fb.group({
      tipo_documento: ['dni', Validators.required],
      numero_documento: ['', [Validators.required, Validators.minLength(8)]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.minLength(9)]],
      email: ['', [Validators.email]],
      grupo_sanguineo: [''],
      alergias: ['']
    });

    this.formDetallesCita = this.fb.group({
      motivo_consulta: ['', Validators.required],
      observaciones: [''],
      costo: [0]
    });
  }

  ngOnInit(): void {
    // Inicialización
  }

  // ==================== PASO 1: SELECCIONAR PACIENTE ====================
  
  buscarPacientes(): void {
    if (this.terminoBusqueda.length < 3) {
      this.pacientes = [];
      return;
    }

    this.buscandoPacientes = true;
    this.agendarService.buscarPacientes(this.terminoBusqueda).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pacientes = response.data;
        }
        this.buscandoPacientes = false;
      },
      error: () => {
        this.buscandoPacientes = false;
      }
    });
  }

  seleccionarPaciente(paciente: PacienteBusqueda): void {
    this.pacienteSeleccionado = paciente;
  }

  mostrarFormularioRegistro(): void {
    this.mostrarFormularioNuevo = true;
    this.pacienteSeleccionado = null;
  }

  ocultarFormularioRegistro(): void {
    this.mostrarFormularioNuevo = false;
    this.formNuevoPaciente.reset({ tipo_documento: 'dni' });
  }

  registrarNuevoPaciente(): void {
    if (this.formNuevoPaciente.invalid) {
      this.marcarCamposInvalidos(this.formNuevoPaciente);
      return;
    }

    this.registrandoPaciente = true;
    const datos: RegistroPacienteRapido = this.formNuevoPaciente.value;

    this.agendarService.registrarPacienteRapido(datos).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pacienteSeleccionado = response.data;
          this.mostrarFormularioNuevo = false;
          this.formNuevoPaciente.reset({ tipo_documento: 'dni' });
          alert('Paciente registrado exitosamente');
        }
        this.registrandoPaciente = false;
      },
      error: (error) => {
        alert('Error al registrar paciente: ' + (error.error?.message || 'Error desconocido'));
        this.registrandoPaciente = false;
      }
    });
  }

  // ==================== PASO 2: FECHA Y HORA ====================
  
  siguientePaso(): void {
    if (this.pasoActual === 1 && !this.pacienteSeleccionado) {
      alert('Por favor seleccione un paciente');
      return;
    }

    if (this.pasoActual === 2 && !this.slotSeleccionado) {
      alert('Por favor seleccione una fecha y hora');
      return;
    }

    if (this.pasoActual === 3 && this.formDetallesCita.invalid) {
      this.marcarCamposInvalidos(this.formDetallesCita);
      alert('Por favor complete los detalles de la cita');
      return;
    }

    if (this.pasoActual < 4) {
      this.pasoActual++;
      
      // Cargar datos según el paso
      if (this.pasoActual === 2) {
        this.cargarFechasDisponibles();
      }
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  cargarFechasDisponibles(): void {
    // Por ahora generamos fechas de los próximos 7 días
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];
    this.cargarSlotsParaFecha(this.fechaSeleccionada);
  }

  onFechaChange(event: any): void {
    this.fechaSeleccionada = event.target.value;
    this.cargarSlotsParaFecha(this.fechaSeleccionada);
  }

  cargarSlotsParaFecha(fecha: string): void {
    this.cargandoSlots = true;
    this.agendarService.obtenerSlotsDisponibles(fecha).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.slotsDisponibles = response.data;
        } else {
          // Generar slots por defecto si el backend no está listo
          this.generarSlotsDefault();
        }
        this.cargandoSlots = false;
      },
      error: () => {
        // Generar slots por defecto en caso de error
        this.generarSlotsDefault();
        this.cargandoSlots = false;
      }
    });
  }

  generarSlotsDefault(): void {
    // Generar slots de 8:00 AM a 6:00 PM cada 30 minutos
    this.slotsDisponibles = [];
    for (let hora = 8; hora < 18; hora++) {
      for (let minuto of [0, 30]) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        const horaFinMinutos = minuto === 30 ? 0 : 30;
        const horaFin = minuto === 30 ? hora + 1 : hora;
        const horaFinStr = `${horaFin.toString().padStart(2, '0')}:${horaFinMinutos.toString().padStart(2, '0')}`;
        
        this.slotsDisponibles.push({
          hora_inicio: horaStr,
          hora_fin: horaFinStr,
          disponible: true
        });
      }
    }
  }

  seleccionarSlot(slot: SlotDisponible): void {
    if (slot.disponible) {
      this.slotSeleccionado = slot;
    }
  }

  // ==================== PASO 4: CONFIRMAR Y AGENDAR ====================
  
  confirmarYAgendar(): void {
    if (!this.pacienteSeleccionado || !this.slotSeleccionado || this.formDetallesCita.invalid) {
      alert('Faltan datos por completar');
      return;
    }

    if (!confirm('¿Confirmar el agendamiento de esta cita?')) {
      return;
    }

    this.agendando = true;

    const fechaHoraInicio = `${this.fechaSeleccionada}T${this.slotSeleccionado.hora_inicio}:00`;
    const fechaHoraFin = `${this.fechaSeleccionada}T${this.slotSeleccionado.hora_fin}:00`;

    const datos: AgendarCitaData = {
      paciente_id: this.pacienteSeleccionado.id,
      fecha_hora_inicio: fechaHoraInicio,
      fecha_hora_fin: fechaHoraFin,
      motivo_consulta: this.formDetallesCita.value.motivo_consulta,
      observaciones: this.formDetallesCita.value.observaciones || '',
      costo: this.formDetallesCita.value.costo || 0
    };

    this.agendarService.agendarCita(datos).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Cita agendada exitosamente');
          this.router.navigate(['/medico/citas']);
        }
        this.agendando = false;
      },
      error: (error) => {
        alert('Error al agendar cita: ' + (error.error?.message || 'Error desconocido'));
        this.agendando = false;
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Está seguro de cancelar? Se perderán los datos ingresados.')) {
      this.router.navigate(['/medico/citas']);
    }
  }

  // ==================== UTILIDADES ====================
  
  private marcarCamposInvalidos(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  get minFecha(): string {
    return new Date().toISOString().split('T')[0];
  }

  get maxFecha(): string {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + 3);
    return fecha.toISOString().split('T')[0];
  }
}
