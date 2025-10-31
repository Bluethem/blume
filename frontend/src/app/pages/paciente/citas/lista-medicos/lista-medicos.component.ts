import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MedicosService } from '../../../../services/medicos.service';
import { EspecialidadesService } from '../../../../services/especialidades.service';
import { Medico, Especialidad } from '../../../../models/index';
import { MedicoCardComponent } from './components/medico-card/medico-card.component';
import { FiltrosMedicosComponent } from './components/filtros-medicos/filtros-medicos.component';

interface FiltrosMedicos {
  q: string;
  especialidad_id?: string;
  costo_max?: number;
  experiencia_min?: number;
  disponible_hoy?: boolean;
  orden: 'nombre' | 'experiencia' | 'precio_asc' | 'precio_desc';
}

@Component({
  selector: 'app-lista-medicos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MedicoCardComponent,
    FiltrosMedicosComponent
  ],
  templateUrl: './lista-medicos.component.html',
  styleUrls: ['./lista-medicos.component.css']
})
export class ListaMedicosComponent implements OnInit {
  private medicosService = inject(MedicosService);
  private especialidadesService = inject(EspecialidadesService);
  private router = inject(Router);

  // Estado
  medicos: Medico[] = [];
  especialidades: Especialidad[] = [];
  loading = false;
  error: string | null = null;

  // Paginación
  currentPage = 1;
  perPage = 12;
  totalPages = 0;
  totalMedicos = 0;

  // Filtros
  filtros: FiltrosMedicos = {
    q: '',
    orden: 'nombre'
  };

  ngOnInit(): void {
    this.cargarEspecialidades();
    this.cargarMedicos();
  }

  cargarEspecialidades(): void {
    this.especialidadesService.getEspecialidades().subscribe({
        next: (response) => {
        if (response.success) {
            this.especialidades = response.data;
        }
        },
        error: (err) => console.error('Error al cargar especialidades:', err)
    });
    }

    cargarMedicos(): void {
        this.loading = true;
        this.error = null;

        const params = {
            ...this.filtros,
            page: this.currentPage,
            per_page: this.perPage
        };

        this.medicosService.getMedicos(params).subscribe({
            next: (response) => {
            if (response.success && response.data) {
                this.medicos = response.data;
                
                if (response.meta) {
                this.currentPage = response.meta.page || 1;
                this.perPage = response.meta.per_page || 12;
                this.totalMedicos = response.meta.total || 0;
                this.totalPages = response.meta.total_pages || 0;
                }
            }
            this.loading = false;
            },
            error: (err) => {
            console.error('Error al cargar médicos:', err);
            this.error = 'Error al cargar los médicos. Por favor, intente nuevamente.';
            this.loading = false;
            }
        });
    }

  // Eventos de filtros
  onFiltrosChange(nuevosFiltros: Partial<FiltrosMedicos>): void {
    this.filtros = { ...this.filtros, ...nuevosFiltros };
    this.currentPage = 1; // Reset a página 1 al filtrar
    this.cargarMedicos();
  }

  onBuscar(termino: string): void {
    this.filtros.q = termino;
    this.currentPage = 1;
    this.cargarMedicos();
  }

  onLimpiarFiltros(): void {
    this.filtros = {
      q: '',
      orden: 'nombre'
    };
    this.currentPage = 1;
    this.cargarMedicos();
  }

  // Paginación
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
      this.cargarMedicos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.currentPage - 2);
    const fin = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  // Navegación a detalle
  verDetalleMedico(medico: Medico): void {
    this.router.navigate(['/paciente/citas/medicos', medico.id]);
  }

  agendarCita(medico: Medico): void {
    this.router.navigate(['/paciente/citas/medicos', medico.id, 'agendar']);
  }

  calcularHasta(): number {
    return Math.min(this.currentPage * this.perPage, this.totalMedicos);
  }
}