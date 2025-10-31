import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { AdminMedicosService } from '../../../../services/admin-medicos.service';
import { AdminCertificacionesService } from '../../../../services/admin-certificaciones.service';
import { EspecialidadesService } from '../../../../services/especialidades.service';
import { Router } from '@angular/router';

interface Certificacion {
  nombre: string;
  institucion: string;
  fecha_obtencion: string;
}

@Component({
  selector: 'app-medico-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medico-form.component.html',
  styleUrls: ['./medico-form.component.css']
})
export class MedicoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private medicosService = inject(AdminMedicosService);
  private certificacionesService = inject(AdminCertificacionesService);
  private especialidadesService = inject(EspecialidadesService);
  private router = inject(Router);

  @Input() medicoId: string | null = null;
  @Output() onSuccess = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  medicoForm!: FormGroup;
  loading = false;
  submitting = false;
  isEditMode = false;
  showDeleteConfirm = false;

  // Especialidades y certificaciones disponibles (catálogos)
  especialidadesDisponibles: any[] = [];
  certificacionesDisponibles: any[] = [];

  ngOnInit(): void {
    if (this.medicoId) {
      this.isEditMode = true;
    }
    
    this.initForm();
    this.loadEspecialidades();
    this.loadCertificaciones();
    
    if (this.medicoId) {
      this.loadMedico();
    } else {
      // En modo creación, agregar una especialidad vacía por defecto
      this.addEspecialidad();
    }
  }

  initForm(): void {
    this.medicoForm = this.fb.group({
      // Información del Usuario
      usuario_attributes: this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        apellido: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required]],
        direccion: [''],
        password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]],
        password_confirmation: ['', this.isEditMode ? [] : []]
      }),
      
      // Información Profesional
      numero_colegiatura: ['', [Validators.required]],
      anios_experiencia: [0, [Validators.required, Validators.min(0)]],
      costo_consulta: [0, [Validators.required, Validators.min(0)]],
      biografia: [''],
      
      // Especialidades (dinámicas)
      especialidades: this.fb.array([], Validators.required),
      
      // Certificaciones
      certificaciones: this.fb.array([])
    });
  }

  get especialidades(): FormArray {
    return this.medicoForm.get('especialidades') as FormArray;
  }

  get certificaciones(): FormArray {
    return this.medicoForm.get('certificaciones') as FormArray;
  }

  get f() {
    return this.medicoForm.controls;
  }

  get u() {
    return (this.medicoForm.get('usuario_attributes') as FormGroup).controls;
  }

  loadMedico(): void {
    if (!this.medicoId) return;

    this.loading = true;
    this.medicosService.getMedico(this.medicoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al cargar los datos del médico');
      }
    });
  }

  loadEspecialidades(): void {
    this.especialidadesService.getEspecialidades().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.especialidadesDisponibles = response.data;
        }
      },
      error: (error) => {
        console.error('Error al cargar especialidades:', error);
      }
    });
  }

  loadCertificaciones(): void {
    this.certificacionesService.getCertificaciones({ per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.certificacionesDisponibles = response.data.certificaciones;
        }
      },
      error: (error) => {
        console.error('Error al cargar certificaciones:', error);
      }
    });
  }

  populateForm(data: any): void {
    // Usuario
    this.medicoForm.patchValue({
      usuario_attributes: {
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        email: data.usuario.email,
        telefono: data.usuario.telefono,
        direccion: data.usuario.direccion
      },
      numero_colegiatura: data.numero_colegiatura,
      anios_experiencia: data.anios_experiencia,
      costo_consulta: data.costo_consulta,
      biografia: data.biografia
    });

    // Especialidades
    if (data.especialidades && data.especialidades.length > 0) {
      data.especialidades.forEach((esp: any) => {
        this.addEspecialidad({
          especialidad_id: esp.id,
          es_principal: esp.es_principal
        });
      });
    }

    // Certificaciones
    if (data.certificaciones && data.certificaciones.length > 0) {
      data.certificaciones.forEach((cert: any) => {
        this.addCertificacion({
          certificacion_id: cert.id,
          fecha_obtencion: cert.fecha_obtencion
        });
      });
    }
  }

  addEspecialidad(esp?: any): void {
    const espGroup = this.fb.group({
      especialidad_id: [esp?.especialidad_id || '', Validators.required],
      es_principal: [esp?.es_principal || false]
    });

    this.especialidades.push(espGroup);
  }

  removeEspecialidad(index: number): void {
    this.especialidades.removeAt(index);
  }

  marcarComoPrincipal(index: number): void {
    // Desmarcar todas las especialidades como principal
    this.especialidades.controls.forEach((control, i) => {
      control.patchValue({ es_principal: i === index });
    });
  }

  addCertificacion(cert?: any): void {
    const certGroup = this.fb.group({
      certificacion_id: [cert?.certificacion_id || '', Validators.required],
      fecha_obtencion: [cert?.fecha_obtencion || '']
    });

    this.certificaciones.push(certGroup);
  }

  removeCertificacion(index: number): void {
    this.certificaciones.removeAt(index);
  }

  getNombreEspecialidad(especialidadId: string): string {
    const esp = this.especialidadesDisponibles.find(e => e.id === especialidadId);
    return esp?.nombre || 'Especialidad desconocida';
  }

  get tieneEspecialidadPrincipal(): boolean {
    return this.especialidades.controls.some(control => control.value.es_principal === true);
  }

  onSubmit(): void {
    if (this.medicoForm.invalid) {
      this.markFormGroupTouched(this.medicoForm);
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Validar que haya al menos una especialidad marcada como principal
    if (!this.tieneEspecialidadPrincipal) {
      alert('Debe marcar al menos una especialidad como principal');
      return;
    }

    this.submitting = true;
    const formData = this.prepareFormData();

    if (this.isEditMode && this.medicoId) {
      this.updateMedico(formData);
    } else {
      this.createMedico(formData);
    }
  }

  prepareFormData(): any {
    const formValue = this.medicoForm.value;
    
    // Preparar especialidades desde el FormArray
    const especialidades = formValue.especialidades || [];

    // Preparar certificaciones (si las hay y tienen id de certificación)
    const certificaciones = formValue.certificaciones || [];

    const data: any = {
      medico: {
        numero_colegiatura: formValue.numero_colegiatura,
        anios_experiencia: formValue.anios_experiencia,
        costo_consulta: formValue.costo_consulta,
        biografia: formValue.biografia,
        usuario_attributes: formValue.usuario_attributes,
        especialidades: especialidades
      }
    };

    // Solo incluir certificaciones si hay
    if (certificaciones.length > 0) {
      data.medico.certificaciones = certificaciones;
    }

    return data;
  }

  createMedico(data: any): void {
    this.medicosService.createMedico(data).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Médico creado exitosamente');
          this.onSuccess.emit();
          this.router.navigate(['/admin/medicos']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error al crear médico:', error);
        alert('Error al crear médico. Verifique los datos e intente nuevamente.');
        this.submitting = false;
      }
    });
  }

  updateMedico(data: any): void {
    if (!this.medicoId) return;

    // Eliminar password si está vacío en edición
    if (!data.medico.usuario_attributes.password) {
      delete data.medico.usuario_attributes.password;
      delete data.medico.usuario_attributes.password_confirmation;
    }

    this.medicosService.updateMedico(this.medicoId, data).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Médico actualizado exitosamente');
          this.onSuccess.emit();
          this.router.navigate(['/admin/medicos']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error al actualizar médico:', error);
        alert('Error al actualizar médico. Verifique los datos e intente nuevamente.');
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    if (confirm('¿Está seguro que desea cancelar? Se perderán los cambios no guardados.')) {
      this.onCancel.emit();
      this.router.navigate(['/admin/medicos']);
    }
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  deleteMedico(): void {
    if (!this.medicoId) return;

    this.medicosService.deleteMedico(this.medicoId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Médico desactivado exitosamente');
          this.router.navigate(['/admin/medicos']);
        }
        this.showDeleteConfirm = false;
      },
      error: (error) => {
        console.error('Error al eliminar médico:', error);
        alert('Error al eliminar médico');
        this.showDeleteConfirm = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/medicos']);
  }
}
