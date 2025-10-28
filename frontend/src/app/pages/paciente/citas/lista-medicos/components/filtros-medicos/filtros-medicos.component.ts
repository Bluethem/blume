// filtros-medicos.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Especialidad } from '../../../../../../models/index';

interface FiltrosMedicos {
  q: string;
  especialidad_id?: string;
  costo_max?: number;
  experiencia_min?: number;
  disponible_hoy?: boolean;
  orden: 'nombre' | 'experiencia' | 'precio_asc' | 'precio_desc';
}

@Component({
  selector: 'app-filtros-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtros-medicos.component.html',
  styleUrl: './filtros-medicos.component.css'
})
export class FiltrosMedicosComponent implements OnInit {
  @Input() especialidades: Especialidad[] = [];
  @Input() filtrosActivos!: FiltrosMedicos;
  
  @Output() filtrosChange = new EventEmitter<Partial<FiltrosMedicos>>();
  @Output() buscar = new EventEmitter<string>();
  @Output() limpiar = new EventEmitter<void>();

  // Estado local
  searchTerm = '';
  especialidadSeleccionada = '';
  costoMaximo?: number;
  experienciaMinima?: number;
  soloDisponiblesHoy = false;
  ordenSeleccionado: string = 'nombre';

  // Dropdown states
  dropdownEspecialidad = false;
  dropdownDisponibilidad = false;
  dropdownCosto = false;
  dropdownOrden = false;
  private closeTimers: any = {};

  // Opciones de costo
  opcionesCosto = [
    { label: 'Hasta $50', value: 50 },
    { label: 'Hasta $75', value: 75 },
    { label: 'Hasta $100', value: 100 },
    { label: 'Hasta $150', value: 150 },
    { label: 'Sin límite', value: undefined }
  ];

  // Opciones de experiencia
  opcionesExperiencia = [
    { label: 'Sin filtro', value: undefined },
    { label: 'Mínimo 5 años', value: 5 },
    { label: 'Mínimo 10 años', value: 10 },
    { label: 'Mínimo 15 años', value: 15 },
    { label: 'Mínimo 20 años', value: 20 }
  ];

  // Opciones de ordenamiento
  opcionesOrden = [
    { label: 'Nombre (A-Z)', value: 'nombre' },
    { label: 'Más experiencia', value: 'experiencia' },
    { label: 'Menor precio', value: 'precio_asc' },
    { label: 'Mayor precio', value: 'precio_desc' }
  ];

  ngOnInit(): void {
    // Inicializar con valores actuales si existen
    if (this.filtrosActivos) {
      this.searchTerm = this.filtrosActivos.q || '';
      this.especialidadSeleccionada = this.filtrosActivos.especialidad_id || '';
      this.costoMaximo = this.filtrosActivos.costo_max;
      this.experienciaMinima = this.filtrosActivos.experiencia_min;
      this.soloDisponiblesHoy = this.filtrosActivos.disponible_hoy || false;
      this.ordenSeleccionado = this.filtrosActivos.orden || 'nombre';
    }
  }

  // Búsqueda por texto
  onSearchChange(): void {
    this.buscar.emit(this.searchTerm);
  }

  // Filtro de especialidad
  seleccionarEspecialidad(especialidadId: string): void {
    this.especialidadSeleccionada = especialidadId;
    this.dropdownEspecialidad = false;
    this.emitirCambios();
  }

  // Filtro de costo
  seleccionarCosto(costo?: number): void {
    this.costoMaximo = costo;
    this.dropdownCosto = false;
    this.emitirCambios();
  }

  // Filtro de experiencia
  seleccionarExperiencia(experiencia?: number): void {
    this.experienciaMinima = experiencia;
    this.emitirCambios();
  }

  // Filtro de disponibilidad
  toggleDisponibilidad(): void {
    this.soloDisponiblesHoy = !this.soloDisponiblesHoy;
    this.emitirCambios();
  }

  // Ordenamiento
  seleccionarOrden(orden: string): void {
    this.ordenSeleccionado = orden;
    this.dropdownOrden = false;
    this.emitirCambios();
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.especialidadSeleccionada = '';
    this.costoMaximo = undefined;
    this.experienciaMinima = undefined;
    this.soloDisponiblesHoy = false;
    this.ordenSeleccionado = 'nombre';
    this.limpiar.emit();
  }

  // Programar cierre en blur (para permitir click en opciones)
  scheduleCloseEspecialidad(): void {
    this.scheduleClose('dropdownEspecialidad');
  }
  scheduleCloseDisponibilidad(): void {
    this.scheduleClose('dropdownDisponibilidad');
  }
  scheduleCloseCosto(): void {
    this.scheduleClose('dropdownCosto');
  }
  scheduleCloseOrden(): void {
    this.scheduleClose('dropdownOrden');
  }

  private scheduleClose(prop: 'dropdownEspecialidad'|'dropdownDisponibilidad'|'dropdownCosto'|'dropdownOrden'): void {
    if (this.closeTimers[prop]) {
      clearTimeout(this.closeTimers[prop]);
    }
    this.closeTimers[prop] = setTimeout(() => {
      this[prop] = false as any;
    }, 200);
  }

  // Emitir cambios al padre
  private emitirCambios(): void {
    const filtros: Partial<FiltrosMedicos> = {
      especialidad_id: this.especialidadSeleccionada || undefined,
      costo_max: this.costoMaximo,
      experiencia_min: this.experienciaMinima,
      disponible_hoy: this.soloDisponiblesHoy || undefined,
      orden: this.ordenSeleccionado as any
    };

    // Eliminar propiedades undefined
    Object.keys(filtros).forEach(key => {
      if (filtros[key as keyof typeof filtros] === undefined) {
        delete filtros[key as keyof typeof filtros];
      }
    });

    this.filtrosChange.emit(filtros);
  }

  // Helpers
  get especialidadNombre(): string {
    if (!this.especialidadSeleccionada) return 'Especialidad';
    const esp = this.especialidades.find(e => e.id === this.especialidadSeleccionada);
    return esp?.nombre || 'Especialidad';
  }

  get costoLabel(): string {
    if (!this.costoMaximo) return 'Costo';
    return `Hasta $${this.costoMaximo}`;
  }

  get experienciaLabel(): string {
    if (!this.experienciaMinima) return 'Experiencia';
    return `Mín. ${this.experienciaMinima} años`;
  }

  get ordenLabel(): string {
    const opcion = this.opcionesOrden.find(o => o.value === this.ordenSeleccionado);
    return opcion?.label || 'Ordenar';
  }

  get tienesFiltrosActivos(): boolean {
    return !!(
      this.especialidadSeleccionada ||
      this.costoMaximo ||
      this.experienciaMinima ||
      this.soloDisponiblesHoy
    );
  }

  // Cerrar dropdowns al hacer click fuera
  closeDropdowns(): void {
    this.dropdownEspecialidad = false;
    this.dropdownDisponibilidad = false;
    this.dropdownCosto = false;
    this.dropdownOrden = false;
  }
}