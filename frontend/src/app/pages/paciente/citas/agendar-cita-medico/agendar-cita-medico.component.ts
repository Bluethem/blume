import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicosService } from '../../../../services/medicos.service';
import { CitasService } from '../../../../services/citas.service';
import { Medico, HorariosDisponibles, SlotHorario, ApiResponse } from '../../../../models';

@Component({
  selector: 'app-agendar-cita-medico',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agendar-cita-medico.component.html',
  styleUrls: ['./agendar-cita-medico.component.css']
})
export class AgendarCitaMedicoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private medicosService = inject(MedicosService);
  private citasService = inject(CitasService);
  router = inject(Router); // Public para usar en template
  private route = inject(ActivatedRoute);

  // Estado del wizard (empieza en paso 1 porque el médico ya está seleccionado)
  currentStep = 1; // 1: Fecha y Hora, 2: Información, 3: Confirmación
  totalSteps = 4;

  // Datos
  medicoId: string = '';
  medicoSeleccionado: Medico | null = null;
  horariosDisponibles: HorariosDisponibles | null = null;
  slotSeleccionado: SlotHorario | null = null;
  fechaSeleccionada: string = '';

  // Calendario
  mesActual: Date = new Date();
  diasCalendario: any[] = [];

  // Formularios
  motivoForm: FormGroup;

  // Estados
  isLoading = false;
  isLoadingHorarios = false;
  errorMessage = '';

  constructor() {
    this.motivoForm = this.fb.group({
      motivo_consulta: ['', [Validators.required, Validators.minLength(10)]],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    // Obtener el ID del médico desde la ruta
    this.medicoId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.medicoId) {
      this.cargarMedico();
      this.generarCalendario();
    } else {
      this.errorMessage = 'No se especificó un médico';
    }
  }

  cargarMedico(): void {
    this.isLoading = true;
    this.medicosService.getMedico(this.medicoId).subscribe({
      next: (response: ApiResponse<Medico>) => {
        if (response.success && response.data) {
          this.medicoSeleccionado = response.data;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando médico:', error);
        this.errorMessage = 'Error al cargar información del médico';
        this.isLoading = false;
      }
    });
  }

  generarCalendario(): void {
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Días del mes anterior para llenar
    const diasPrevios = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
    
    this.diasCalendario = [];
    
    // Días del mes anterior
    for (let i = diasPrevios; i > 0; i--) {
      const dia = new Date(year, month, -i + 1);
      this.diasCalendario.push({
        fecha: dia,
        dia: dia.getDate(),
        esOtroMes: true,
        esHoy: false,
        esPasado: true,
        tieneDisponibilidad: false
      });
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      this.diasCalendario.push({
        fecha: fecha,
        dia: dia,
        esOtroMes: false,
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: fecha < hoy,
        tieneDisponibilidad: Math.random() > 0.5 && fecha >= hoy // Simulado
      });
    }
    
    // Días del mes siguiente para completar
    const diasRestantes = 42 - this.diasCalendario.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const dia = new Date(year, month + 1, i);
      this.diasCalendario.push({
        fecha: dia,
        dia: dia.getDate(),
        esOtroMes: true,
        esHoy: false,
        esPasado: false,
        tieneDisponibilidad: false
      });
    }
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1);
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1);
    this.generarCalendario();
  }

  seleccionarFecha(diaInfo: any): void {
    if (diaInfo.esOtroMes || diaInfo.esPasado) return;
    
    this.fechaSeleccionada = diaInfo.fecha.toISOString().split('T')[0];
    this.cargarHorarios(this.fechaSeleccionada);
  }

  cargarHorarios(fecha: string): void {
    if (!this.medicoId) return;

    this.isLoadingHorarios = true;
    this.slotSeleccionado = null;
    
    this.medicosService.getHorariosDisponibles(this.medicoId, fecha).subscribe({
      next: (response: ApiResponse<HorariosDisponibles>) => {
        if (response.success && response.data) {
          this.horariosDisponibles = response.data;
        }
        this.isLoadingHorarios = false;
      },
      error: (error: any) => {
        console.error('Error cargando horarios:', error);
        this.errorMessage = 'Error al cargar horarios disponibles';
        this.isLoadingHorarios = false;
      }
    });
  }

  seleccionarHorario(slot: SlotHorario): void {
    if (!slot.disponible) return;
    this.slotSeleccionado = slot;
  }

  cambiarMedico(): void {
    this.router.navigate(['/paciente/citas/medicos']);
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps - 1) {
      if (this.validarPasoActual()) {
        this.currentStep++;
        this.errorMessage = '';
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    } else {
      // Volver a la lista de médicos
      this.router.navigate(['/paciente/citas/medicos']);
    }
  }

  validarPasoActual(): boolean {
    switch (this.currentStep) {
      case 1:
        if (!this.slotSeleccionado) {
          this.errorMessage = 'Debes seleccionar fecha y hora';
          return false;
        }
        return true;
      case 2:
        if (this.motivoForm.invalid) {
          this.errorMessage = 'Completa el motivo de consulta (mínimo 10 caracteres)';
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  confirmarCita(): void {
    if (!this.medicoSeleccionado || !this.slotSeleccionado) {
      this.errorMessage = 'Datos incompletos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const citaData = {
      cita: {
        medico_id: this.medicoSeleccionado.id,
        fecha_hora_inicio: this.slotSeleccionado.fecha_hora_inicio,
        fecha_hora_fin: this.slotSeleccionado.fecha_hora_fin,
        motivo_consulta: this.motivoForm.value.motivo_consulta,
        observaciones: this.motivoForm.value.observaciones
      }
    };

    this.citasService.crearCita(citaData).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.nextStep(); // Ir a confirmación
          setTimeout(() => {
            this.router.navigate(['/paciente/citas/mis-citas']);
          }, 3000);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error creando cita:', error);
        this.errorMessage = error.error?.message || 'Error al agendar la cita';
        this.isLoading = false;
      }
    });
  }

  get nombreMesActual(): string {
    return this.mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  get horariosManana(): SlotHorario[] {
    if (!this.horariosDisponibles?.slots) return [];
    return this.horariosDisponibles.slots.filter((slot: SlotHorario) => {
      const hora = new Date(slot.fecha_hora_inicio).getHours();
      return hora < 12;
    });
  }

  get horariosTarde(): SlotHorario[] {
    if (!this.horariosDisponibles?.slots) return [];
    return this.horariosDisponibles.slots.filter((slot: SlotHorario) => {
      const hora = new Date(slot.fecha_hora_inicio).getHours();
      return hora >= 12;
    });
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  esFechaSeleccionada(diaInfo: any): boolean {
    if (!this.fechaSeleccionada) return false;
    const fechaDia = diaInfo.fecha.toISOString().split('T')[0];
    return fechaDia === this.fechaSeleccionada;
  }
}
