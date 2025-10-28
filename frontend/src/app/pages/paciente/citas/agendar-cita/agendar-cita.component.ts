import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicosService, Medico, HorarioDisponible, SlotHorario } from '../../../../services/medicos.service';
import { CitasService, CrearCitaRequest } from '../../../../services/citas.service';

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

  // Estado del wizard
  currentStep = 0;
  totalSteps = 4;

  // Datos
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  medicoSeleccionado: Medico | null = null;
  horariosDisponibles: HorarioDisponible | null = null;
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
    this.cargarMedicos();

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

  cargarMedicos(): void {
    this.isLoading = true;
    this.medicosService.getMedicos({ per_page: 20 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.medicos = response.data;
          this.medicosFiltrados = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
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
      // ✅ CORREGIDO: Buscar en especialidad_principal o especialidades
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
      next: (response) => {
        if (response.success) {
          this.horariosDisponibles = response.data;
        }
        this.isLoadingHorarios = false;
      },
      error: (error) => {
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

    const citaData: CrearCitaRequest = {
      cita: {
        medico_id: this.medicoSeleccionado.id,
        fecha_hora_inicio: this.slotSeleccionado.fecha_hora_inicio,
        fecha_hora_fin: this.slotSeleccionado.fecha_hora_fin,
        motivo_consulta: this.motivoForm.value.motivo_consulta,
        observaciones: this.motivoForm.value.observaciones
      }
    };

    this.citasService.crearCita(citaData).subscribe({
      next: (response) => {
        if (response.success) {
          this.nextStep(); // Ir a confirmación
          setTimeout(() => {
            this.router.navigate(['/dashboard/paciente']);
          }, 3000);
        }
      },
      error: (error) => {
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
}