import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MedicosService } from '../../../../services/medicos.service';
import { CitasService } from '../../../../services/citas.service';
import { Medico, HorariosDisponibles, SlotHorario, ApiResponse } from '../../../../models';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agendar-cita.component.html',
  styleUrls: ['./agendar-cita.component.css']
})
export class AgendarCitaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private medicosService = inject(MedicosService);
  private citasService = inject(CitasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estado del wizard
  currentStep = 0;
  totalSteps = 4;

  // Datos
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  medicoSeleccionado: Medico | null = null;
  horariosDisponibles: HorariosDisponibles | null = null;
  slotSeleccionado: SlotHorario | null = null;

  // Formularios
  searchForm: FormGroup;
  fechaForm: FormGroup;
  motivoForm: FormGroup;

  // Estados
  isLoading = false;
  isLoadingHorarios = false;
  errorMessage = '';
  searchQuery = '';

  constructor() {
    this.searchForm = this.fb.group({
      search: ['']
    });

    this.fechaForm = this.fb.group({
      fecha: ['', Validators.required]
    });

    this.motivoForm = this.fb.group({
      motivo_consulta: ['', [Validators.required, Validators.minLength(10)]],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    // Verificar si viene médico por query params
    this.route.queryParams.subscribe(params => {
      const medicoId = params['medico_id'];
      const slotInicio = params['slot_inicio'];
      const slotFin = params['slot_fin'];
      
      if (medicoId) {
        this.cargarMedicoPreseleccionado(medicoId);
        
        // Si viene con slot preseleccionado (desde cita rápida)
        if (slotInicio && slotFin) {
          const fecha = new Date(slotInicio).toISOString().split('T')[0];
          this.fechaForm.patchValue({ fecha });
          
          // Esperar a que cargue el médico y luego los horarios
          setTimeout(() => {
            this.cargarHorarios(fecha);
            setTimeout(() => {
              // Preseleccionar el slot
              const slot = this.horariosDisponibles?.slots?.find(s => 
                s.fecha_hora_inicio === slotInicio && s.fecha_hora_fin === slotFin
              );
              if (slot) {
                this.slotSeleccionado = slot;
                this.currentStep = 2; // Ir directo al paso de motivo
              }
            }, 500);
          }, 500);
        }
      } else {
        this.cargarMedicos();
      }
    });

    // Escuchar cambios en el search
    this.searchForm.get('search')?.valueChanges.subscribe(value => {
      this.filtrarMedicos(value);
    });

    // Escuchar cambios en la fecha
    this.fechaForm.get('fecha')?.valueChanges.subscribe(fecha => {
      if (fecha && this.medicoSeleccionado) {
        this.cargarHorarios(fecha);
      }
    });
  }

  cargarMedicoPreseleccionado(medicoId: string): void {
    this.isLoading = true;
    this.medicosService.getMedico(medicoId).subscribe({
      next: (response: ApiResponse<Medico>) => {
        if (response.success && response.data) {
          this.medicoSeleccionado = response.data;
          this.currentStep = 1; // Saltar al paso de fecha
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando médico:', error);
        this.errorMessage = 'Error al cargar médico';
        this.isLoading = false;
        this.cargarMedicos(); // Cargar lista si falla
      }
    });
  }

  cargarMedicos(): void {
    this.isLoading = true;
    this.medicosService.getMedicos({ per_page: 50 }).subscribe({
      next: (response: ApiResponse<Medico[]>) => {
        if (response.success && response.data) {
          this.medicos = response.data;
          this.medicosFiltrados = response.data;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando médicos:', error);
        this.errorMessage = 'Error al cargar los médicos';
        this.isLoading = false;
      }
    });
  }

  filtrarMedicos(query: string): void {
    if (!query) {
      this.medicosFiltrados = this.medicos;
      return;
    }

    const queryLower = query.toLowerCase();
    this.medicosFiltrados = this.medicos.filter(medico => {
      const nombreCompleto = medico.nombre_completo?.toLowerCase() || '';
      const especialidad = medico.especialidad_principal?.nombre?.toLowerCase() || 
                          medico.especialidad?.toLowerCase() || '';
      
      return nombreCompleto.includes(queryLower) || especialidad.includes(queryLower);
    });
  }

  seleccionarMedico(medico: Medico): void {
    this.medicoSeleccionado = medico;
    this.nextStep();
  }

  cargarHorarios(fecha: string): void {
    if (!this.medicoSeleccionado) return;

    this.isLoadingHorarios = true;
    this.medicosService.getHorariosDisponibles(this.medicoSeleccionado.id, fecha).subscribe({
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

  nextStep(): void {
    if (this.currentStep < this.totalSteps - 1) {
      // Validar paso actual antes de avanzar
      if (this.validarPasoActual()) {
        this.currentStep++;
        this.errorMessage = '';
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  validarPasoActual(): boolean {
    switch (this.currentStep) {
      case 0:
        if (!this.medicoSeleccionado) {
          this.errorMessage = 'Debes seleccionar un médico';
          return false;
        }
        return true;
      case 1:
        if (!this.slotSeleccionado) {
          this.errorMessage = 'Debes seleccionar fecha y hora';
          return false;
        }
        return true;
      case 2:
        if (this.motivoForm.invalid) {
          this.errorMessage = 'Completa el motivo de consulta';
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
      },
      error: (error: any) => {
        console.error('Error creando cita:', error);
        this.errorMessage = error.message || 'Error al agendar la cita';
        this.isLoading = false;
      }
    });
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearHora(fechaHora: string): string {
    return new Date(fechaHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  get fechaMinima(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  get fechaMaxima(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 3 meses
    return maxDate.toISOString().split('T')[0];
  }

  // ✅ Getters para separar horarios (igual que agendar-cita-medico)
  get horariosManana(): SlotHorario[] {
    if (!this.horariosDisponibles?.slots) return [];
    return this.horariosDisponibles.slots.filter((slot: SlotHorario) => {
      const hora = new Date(slot.fecha_hora_inicio).getHours();
      return hora < 12 && slot.disponible; // ✅ Solo disponibles
    });
  }

  get horariosTarde(): SlotHorario[] {
    if (!this.horariosDisponibles?.slots) return [];
    return this.horariosDisponibles.slots.filter((slot: SlotHorario) => {
      const hora = new Date(slot.fecha_hora_inicio).getHours();
      return hora >= 12 && slot.disponible; // ✅ Solo disponibles
    });
  }
}