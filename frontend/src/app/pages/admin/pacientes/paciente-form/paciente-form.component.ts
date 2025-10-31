import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminPacientesService } from '../../../../services/admin-pacientes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paciente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './paciente-form.component.html',
  styleUrls: ['./paciente-form.component.css']
})
export class PacienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pacientesService = inject(AdminPacientesService);
  private router = inject(Router);

  @Input() pacienteId: string | null = null;
  @Output() onSuccess = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  pacienteForm!: FormGroup;
  loading = false;
  submitting = false;
  isEditMode = false;
  showDeleteConfirm = false;

  // Opciones de selección
  tiposDocumento = ['DNI', 'Pasaporte', 'NIE', 'Carnet de Extranjería'];
  gruposSanguineos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  generos = ['Masculino', 'Femenino', 'Otro'];

  ngOnInit(): void {
    if (this.pacienteId) {
      this.isEditMode = true;
    }
    
    this.initForm();
    
    if (this.pacienteId) {
      this.loadPaciente();
    }
  }

  initForm(): void {
    this.pacienteForm = this.fb.group({
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
      
      // Información del Paciente
      numero_documento: ['', [Validators.required]],
      tipo_documento: ['DNI', [Validators.required]],
      fecha_nacimiento: ['', [Validators.required]],
      genero: ['Masculino', [Validators.required]],
      grupo_sanguineo: [''],
      alergias: [''],
      observaciones: ['']
    });
  }

  get f() {
    return this.pacienteForm.controls;
  }

  get u() {
    return (this.pacienteForm.get('usuario_attributes') as FormGroup).controls;
  }

  loadPaciente(): void {
    if (!this.pacienteId) return;

    this.loading = true;
    this.pacientesService.getPaciente(this.pacienteId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Error al cargar los datos del paciente');
      }
    });
  }

  populateForm(data: any): void {
    this.pacienteForm.patchValue({
      usuario_attributes: {
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        email: data.usuario.email,
        telefono: data.usuario.telefono,
        direccion: data.usuario.direccion
      },
      numero_documento: data.numero_documento,
      tipo_documento: data.tipo_documento,
      fecha_nacimiento: data.fecha_nacimiento,
      genero: data.genero,
      grupo_sanguineo: data.grupo_sanguineo,
      alergias: data.alergias,
      observaciones: data.observaciones
    });
  }

  onSubmit(): void {
    if (this.pacienteForm.invalid) {
      this.markFormGroupTouched(this.pacienteForm);
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.submitting = true;
    const formData = this.prepareFormData();

    if (this.isEditMode && this.pacienteId) {
      this.updatePaciente(formData);
    } else {
      this.createPaciente(formData);
    }
  }

  prepareFormData(): any {
    const formValue = this.pacienteForm.value;

    const data: any = {
      paciente: {
        numero_documento: formValue.numero_documento,
        tipo_documento: formValue.tipo_documento,
        fecha_nacimiento: formValue.fecha_nacimiento,
        genero: formValue.genero,
        grupo_sanguineo: formValue.grupo_sanguineo || null,
        alergias: formValue.alergias || null,
        observaciones: formValue.observaciones || null,
        usuario_attributes: formValue.usuario_attributes
      }
    };

    return data;
  }

  createPaciente(data: any): void {
    this.pacientesService.createPaciente(data).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Paciente creado exitosamente');
          this.onSuccess.emit();
          this.router.navigate(['/admin/pacientes']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error al crear paciente:', error);
        alert('Error al crear paciente. Verifique los datos e intente nuevamente.');
        this.submitting = false;
      }
    });
  }

  updatePaciente(data: any): void {
    if (!this.pacienteId) return;

    // Eliminar password si está vacío en edición
    if (!data.paciente.usuario_attributes.password) {
      delete data.paciente.usuario_attributes.password;
      delete data.paciente.usuario_attributes.password_confirmation;
    }

    this.pacientesService.updatePaciente(this.pacienteId, data).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Paciente actualizado exitosamente');
          this.onSuccess.emit();
          this.router.navigate(['/admin/pacientes']);
        }
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error al actualizar paciente:', error);
        alert('Error al actualizar paciente. Verifique los datos e intente nuevamente.');
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    if (confirm('¿Está seguro que desea cancelar? Se perderán los cambios no guardados.')) {
      this.onCancel.emit();
      this.router.navigate(['/admin/pacientes']);
    }
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  deletePaciente(): void {
    if (!this.pacienteId) return;

    this.pacientesService.deletePaciente(this.pacienteId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Paciente desactivado exitosamente');
          this.router.navigate(['/admin/pacientes']);
        }
        this.showDeleteConfirm = false;
      },
      error: (error) => {
        console.error('Error al eliminar paciente:', error);
        alert('Error al eliminar paciente');
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
    this.router.navigate(['/admin/pacientes']);
  }
}
