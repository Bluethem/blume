import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EditarPacienteModalComponent } from '../editar-paciente-modal/editar-paciente-modal.component';

interface PacienteCompleto {
  id: string;
  nombre_completo: string;
  numero_documento: string;
  tipo_documento: string;
  foto_url?: string;
  telefono: string;
  email: string;
  edad: number;
  fecha_nacimiento: string;
  genero: string;
  grupo_sanguineo?: string;
  alergias?: string;
  historial_citas: CitaHistorial[];
}

interface CitaHistorial {
  id: string;
  fecha_hora_inicio: string;
  estado: string;
  motivo_consulta: string;
  diagnostico?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-detalle-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, EditarPacienteModalComponent],
  templateUrl: './detalle-paciente.component.html',
  styleUrls: ['./detalle-paciente.component.css']
})
export class DetallePacienteComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  paciente: PacienteCompleto | null = null;
  loading = false;
  pacienteId: string = '';
  
  // Notas del médico
  notaMedico = '';
  guardandoNota = false;

  // Filtros
  rangoFechas = 'ultimo_anio';

  // Modal de edición
  modalEditarAbierto = false;

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.pacienteId) {
      this.cargarPaciente();
    } else {
      this.router.navigate(['/medico/pacientes']);
    }
  }

  cargarPaciente(): void {
    this.loading = true;
    this.http.get<ApiResponse<PacienteCompleto>>(`${this.apiUrl}/medico/pacientes/${this.pacienteId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.paciente = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/medico/pacientes']);
      }
    });
  }

  agendarNuevaCita(): void {
    this.router.navigate(['/medico/citas/agendar'], {
      queryParams: { paciente_id: this.pacienteId }
    });
  }

  editarPaciente(): void {
    this.modalEditarAbierto = true;
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto = false;
  }

  onPacienteActualizado(pacienteActualizado: any): void {
    // Recargar datos del paciente
    this.cargarPaciente();
  }

  guardarNota(): void {
    if (!this.notaMedico.trim()) {
      return;
    }

    this.guardandoNota = true;
    // TODO: Implementar endpoint para guardar notas del médico
    setTimeout(() => {
      this.guardandoNota = false;
      this.notaMedico = '';
      alert('Nota guardada exitosamente');
    }, 1000);
  }

  verDetalleCita(citaId: string): void {
    this.router.navigate(['/medico/citas/detalle', citaId]);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatearFechaNacimiento(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getEstadoBadgeClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'completada': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'confirmada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'cancelada': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return clases[estado] || clases['pendiente'];
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'completada': 'Completada',
      'confirmada': 'Confirmada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada'
    };
    return labels[estado] || 'Pendiente';
  }

  getAlergiasList(): string[] {
    if (!this.paciente?.alergias) return [];
    return this.paciente.alergias.split(',').map(a => a.trim()).filter(a => a.length > 0);
  }

  volver(): void {
    this.router.navigate(['/medico/pacientes']);
  }

  get citasFiltradas(): CitaHistorial[] {
    if (!this.paciente) return [];
    
    const hoy = new Date();
    let fechaLimite = new Date();

    switch (this.rangoFechas) {
      case 'ultimos_3_meses':
        fechaLimite.setMonth(hoy.getMonth() - 3);
        break;
      case 'ultimos_6_meses':
        fechaLimite.setMonth(hoy.getMonth() - 6);
        break;
      case 'ultimo_anio':
        fechaLimite.setFullYear(hoy.getFullYear() - 1);
        break;
      case 'todos':
        return this.paciente.historial_citas;
      default:
        fechaLimite.setFullYear(hoy.getFullYear() - 1);
    }

    return this.paciente.historial_citas.filter(cita => {
      const fechaCita = new Date(cita.fecha_hora_inicio);
      return fechaCita >= fechaLimite;
    });
  }
}
