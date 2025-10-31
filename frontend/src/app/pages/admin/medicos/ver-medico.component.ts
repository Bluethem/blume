import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminMedicosService, MedicoDetalle } from '../../../services/admin-medicos.service';

@Component({
  selector: 'app-ver-medico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ver-medico.component.html',
  styleUrls: ['./ver-medico.component.css']
})
export class VerMedicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private medicosService = inject(AdminMedicosService);

  medico: MedicoDetalle | null = null;
  loading = false;
  medicoId: string | null = null;

  ngOnInit(): void {
    this.medicoId = this.route.snapshot.paramMap.get('id');
    if (this.medicoId) {
      this.loadMedico();
    }
  }

  loadMedico(): void {
    if (!this.medicoId) return;

    this.loading = true;
    this.medicosService.getMedico(this.medicoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medico = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar médico:', error);
        alert('Error al cargar los datos del médico');
        this.loading = false;
        this.router.navigate(['/admin/medicos']);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/medicos']);
  }

  editar(): void {
    this.router.navigate(['/admin/medicos/editar', this.medicoId]);
  }

  get nombreCompleto(): string {
    if (!this.medico) return 'Médico';
    return `${this.medico.usuario.nombre} ${this.medico.usuario.apellido}`;
  }

  get fotoPerfil(): string {
    return this.medico?.usuario.foto_url || 
           `https://ui-avatars.com/api/?name=${this.nombreCompleto}&size=200&background=B71C1C&color=fff`;
  }

  get especialidadPrincipal(): string {
    const principal = this.medico?.especialidades.find((e: any) => e.es_principal);
    return principal?.nombre || 'Sin especialidad';
  }

  get especialidadesSecundarias(): string[] {
    return this.medico?.especialidades
      .filter((e: any) => !e.es_principal)
      .map((e: any) => e.nombre) || [];
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
