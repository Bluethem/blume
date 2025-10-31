import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminPacientesService, PacienteDetalle } from '../../../services/admin-pacientes.service';

@Component({
  selector: 'app-ver-paciente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-paciente.component.html',
  styleUrls: ['./ver-paciente.component.css']
})
export class VerPacienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pacientesService = inject(AdminPacientesService);

  paciente: PacienteDetalle | null = null;
  loading = true;
  pacienteId: string | null = null;

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.paramMap.get('id');
    if (this.pacienteId) {
      this.cargarPaciente();
    }
  }

  cargarPaciente(): void {
    if (!this.pacienteId) return;

    this.loading = true;
    this.pacientesService.getPaciente(this.pacienteId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.paciente = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar paciente:', error);
        alert('Error al cargar la información del paciente');
        this.loading = false;
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/pacientes']);
  }

  editarPaciente(): void {
    if (this.pacienteId) {
      this.router.navigate(['/admin/pacientes/editar', this.pacienteId]);
    }
  }

  calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
