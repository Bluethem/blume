import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface PacienteListado {
  id: string;
  nombre_completo: string;
  numero_documento: string;
  foto_url?: string;
  telefono?: string;
  edad: number;
  grupo_sanguineo?: string;
  alergias?: string;
  total_citas: number;
  ultima_cita?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-mis-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-pacientes.component.html',
  styleUrls: ['./mis-pacientes.component.css']
})
export class MisPacientesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  pacientes: PacienteListado[] = [];
  pacientesFiltrados: PacienteListado[] = [];
  loading = false;

  // Filtros
  busqueda = '';
  filtroGrupoSanguineo = '';
  filtroAlergias = '';
  ordenarPor = 'nombre';

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes(): void {
    this.loading = true;
    this.http.get<ApiResponse<PacienteListado[]>>(`${this.apiUrl}/medico/pacientes`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pacientes = response.data;
          this.aplicarFiltros();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.pacientes];

    // Filtro de búsqueda
    if (this.busqueda.trim()) {
      const termino = this.busqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.nombre_completo.toLowerCase().includes(termino) ||
        p.numero_documento.includes(termino)
      );
    }

    // Filtro de grupo sanguíneo
    if (this.filtroGrupoSanguineo) {
      resultado = resultado.filter(p => p.grupo_sanguineo === this.filtroGrupoSanguineo);
    }

    // Filtro de alergias
    if (this.filtroAlergias === 'si') {
      resultado = resultado.filter(p => p.alergias && p.alergias.trim().length > 0);
    } else if (this.filtroAlergias === 'no') {
      resultado = resultado.filter(p => !p.alergias || p.alergias.trim().length === 0);
    }

    // Ordenar
    resultado = this.ordenarPacientes(resultado);

    this.pacientesFiltrados = resultado;
  }

  ordenarPacientes(pacientes: PacienteListado[]): PacienteListado[] {
    switch (this.ordenarPor) {
      case 'nombre':
        return pacientes.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
      case 'ultima_cita':
        return pacientes.sort((a, b) => {
          const fechaA = a.ultima_cita ? new Date(a.ultima_cita).getTime() : 0;
          const fechaB = b.ultima_cita ? new Date(b.ultima_cita).getTime() : 0;
          return fechaB - fechaA;
        });
      case 'total_citas':
        return pacientes.sort((a, b) => b.total_citas - a.total_citas);
      default:
        return pacientes;
    }
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  cambiarFiltroGrupoSanguineo(grupo: string): void {
    this.filtroGrupoSanguineo = this.filtroGrupoSanguineo === grupo ? '' : grupo;
    this.aplicarFiltros();
  }

  cambiarFiltroAlergias(valor: string): void {
    this.filtroAlergias = this.filtroAlergias === valor ? '' : valor;
    this.aplicarFiltros();
  }

  cambiarOrden(orden: string): void {
    this.ordenarPor = orden;
    this.aplicarFiltros();
  }

  verHistorial(pacienteId: string): void {
    this.router.navigate(['/medico/pacientes', pacienteId]);
  }

  agendarCita(pacienteId: string): void {
    // Navegar a agendar cita con paciente pre-seleccionado
    this.router.navigate(['/medico/citas/agendar'], { 
      queryParams: { paciente_id: pacienteId } 
    });
  }

  tieneAlergias(paciente: PacienteListado): boolean {
    return !!(paciente.alergias && paciente.alergias.trim().length > 0);
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return 'Sin visitas';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  getGruposSanguineos(): string[] {
    return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  }

  gruposSanguineosUnicos(): string[] {
    const grupos = new Set(
      this.pacientes
        .map(p => p.grupo_sanguineo)
        .filter((g): g is string => !!g)
    );
    return Array.from(grupos).sort();
  }
}
