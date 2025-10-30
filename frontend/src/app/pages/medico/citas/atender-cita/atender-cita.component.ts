import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicoCitasService } from '../../../../services/medico-citas.service';
import { CitaMedico } from '../../../../models/medico-citas.models';

@Component({
  selector: 'app-atender-cita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './atender-cita.component.html',
  styleUrls: ['./atender-cita.component.css']
})
export class AtenderCitaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citasService = inject(MedicoCitasService);

  cita: CitaMedico | null = null;
  loading = false;
  guardando = false;
  citaId: string = '';
  
  form: FormGroup;
  ultimoGuardado: Date | null = null;
  historialAbierto = false;

  constructor() {
    this.form = this.fb.group({
      diagnostico: ['', Validators.required],
      observaciones: [''],
      receta: [''],
      proxima_cita: ['']
    });
  }

  ngOnInit(): void {
    this.citaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.citaId) {
      this.cargarCita();
    } else {
      this.router.navigate(['/medico/citas']);
    }
  }

  cargarCita(): void {
    this.loading = true;
    this.citasService.getCita(this.citaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cita = response.data;
          
          // Pre-cargar datos si ya existen
          if (this.cita.diagnostico) {
            this.form.patchValue({
              diagnostico: this.cita.diagnostico,
              observaciones: this.cita.observaciones || '',
              receta: this.cita.receta || ''
            });
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/medico/citas']);
      }
    });
  }

  guardarBorrador(): void {
    if (!this.cita) return;
    
    // Guardar en localStorage temporalmente
    const borrador = {
      citaId: this.cita.id,
      ...this.form.value,
      timestamp: new Date()
    };
    
    localStorage.setItem(`borrador_cita_${this.cita.id}`, JSON.stringify(borrador));
    this.ultimoGuardado = new Date();
    
    // TODO: Implementar guardado en backend si lo requieren
    alert('Borrador guardado localmente');
  }

  marcarNoAsistio(): void {
    if (!this.cita) return;
    
    if (confirm('¿Está seguro de marcar esta cita como "No Asistió"?')) {
      // TODO: Implementar endpoint para marcar como no asistió
      alert('Funcionalidad en desarrollo');
    }
  }

  cancelar(): void {
    if (this.form.dirty) {
      if (!confirm('Tiene cambios sin guardar. ¿Desea salir de todas formas?')) {
        return;
      }
    }
    
    this.router.navigate(['/medico/citas/detalle', this.citaId]);
  }

  completarConsulta(): void {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();
      alert('Por favor complete el diagnóstico antes de continuar');
      return;
    }

    if (!confirm('¿Desea completar esta consulta? Esta acción no se puede deshacer.')) {
      return;
    }

    this.guardando = true;
    
    const datos = {
      diagnostico: this.form.value.diagnostico,
      observaciones: this.form.value.observaciones || '',
      receta: this.form.value.receta || ''
    };

    this.citasService.completarCita(this.citaId, datos).subscribe({
      next: (response) => {
        if (response.success) {
          // Limpiar borrador
          localStorage.removeItem(`borrador_cita_${this.citaId}`);
          
          alert('Consulta completada exitosamente');
          this.router.navigate(['/medico/citas/detalle', this.citaId]);
        }
        this.guardando = false;
      },
      error: (error) => {
        alert('Error al completar la consulta: ' + (error.error?.message || 'Error desconocido'));
        this.guardando = false;
      }
    });
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  get diagnostico() {
    return this.form.get('diagnostico');
  }

  calcularEdad(fechaNacimiento?: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  toggleHistorial(): void {
    this.historialAbierto = !this.historialAbierto;
  }

  formatearHoraGuardado(): string {
    if (!this.ultimoGuardado) return '';
    return this.ultimoGuardado.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // Cargar borrador desde localStorage si existe
  cargarBorrador(): void {
    const borradorStr = localStorage.getItem(`borrador_cita_${this.citaId}`);
    if (borradorStr) {
      try {
        const borrador = JSON.parse(borradorStr);
        this.form.patchValue(borrador);
        this.ultimoGuardado = new Date(borrador.timestamp);
      } catch (e) {
        console.error('Error al cargar borrador:', e);
      }
    }
  }
}
