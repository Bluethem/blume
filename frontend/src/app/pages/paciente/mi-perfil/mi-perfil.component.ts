import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PacientesService } from '../../../services/pacientes.service';

type TabType = 'personal' | 'medica' | 'seguridad' | 'historial';

interface PerfilUsuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  foto_url?: string;
  paciente?: {
    fecha_nacimiento?: string;
    genero?: string;
    grupo_sanguineo?: string;
    alergias?: string;
    observaciones?: string;
  };
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  router = inject(Router); // ✅ Hazlo público para usarlo en el template
  private authService = inject(AuthService);
  private pacientesService = inject(PacientesService);

  // Estado
  usuario: PerfilUsuario | null = null;
  loading = false;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Tabs
  tabActiva: TabType = 'personal';

  // Formularios
  formPersonal!: FormGroup;
  formMedica!: FormGroup;
  formSeguridad!: FormGroup;

  // Foto
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  ngOnInit(): void {
    this.inicializarFormularios();
    this.cargarPerfil();
  }

  inicializarFormularios(): void {
    // Formulario de información personal
    this.formPersonal = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.pattern(/^\+?[0-9\s\-()]+$/)]],
      direccion: ['']
    });

    // Formulario de información médica
    this.formMedica = this.fb.group({
      fecha_nacimiento: [''],
      genero: [''],
      grupo_sanguineo: [''],
      alergias: [''],
      observaciones: ['']
    });

    // Formulario de seguridad
    this.formSeguridad = this.fb.group({
      password_actual: ['', Validators.required],
      password_nueva: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmacion: ['', Validators.required]
    }, {
      validators: this.passwordsMatchValidator
    });
  }

  passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const nueva = group.get('password_nueva')?.value;
    const confirmacion = group.get('password_confirmacion')?.value;
    return nueva === confirmacion ? null : { passwordsMismatch: true };
  }

  cargarPerfil(): void {
    this.loading = true;
    this.error = null;

    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.usuario = response.data as PerfilUsuario; 
          this.llenarFormularios();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar el perfil';
        this.loading = false;
      }
    });
  }

  llenarFormularios(): void {
    if (!this.usuario) return;

    // Llenar form personal
    this.formPersonal.patchValue({
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      telefono: this.usuario.telefono || '',
      direccion: this.usuario.direccion || ''
    });

    // Llenar form médica
    if (this.usuario.paciente) {
      this.formMedica.patchValue({
        fecha_nacimiento: this.usuario.paciente.fecha_nacimiento || '',
        genero: this.usuario.paciente.genero || '',
        grupo_sanguineo: this.usuario.paciente.grupo_sanguineo || '',
        alergias: this.usuario.paciente.alergias || '',
        observaciones: this.usuario.paciente.observaciones || ''
      });
    }
  }

  // Cambiar tabs
  cambiarTab(tab: TabType): void {
    this.tabActiva = tab;
    this.successMessage = null;
    this.error = null;
  }

  // Guardar información personal
  guardarPersonal(): void {
    if (this.formPersonal.invalid) {
      this.markFormGroupTouched(this.formPersonal);
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const data = this.formPersonal.value;

    this.authService.updateProfile(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Información personal actualizada correctamente';
          this.usuario = { ...this.usuario!, ...data };
        }
        this.saving = false;
      },
      error: (err) => {
        this.error = 'Error al actualizar la información';
        this.saving = false;
      }
    });
  }

  // Guardar información médica
  guardarMedica(): void {
    if (this.formMedica.invalid) {
      this.markFormGroupTouched(this.formMedica);
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const data = this.formMedica.value;

    this.pacientesService.updateInfoMedica(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Información médica actualizada correctamente';
          if (this.usuario) {
            this.usuario.paciente = { ...this.usuario.paciente, ...data };
          }
        }
        this.saving = false;
      },
      error: (err) => {
        this.error = 'Error al actualizar la información médica';
        this.saving = false;
      }
    });
  }

  // Cambiar contraseña
  cambiarPassword(): void {
    if (this.formSeguridad.invalid) {
      this.markFormGroupTouched(this.formSeguridad);
      return;
    }

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    const currentPassword = this.formSeguridad.value.password_actual;
    const newPassword = this.formSeguridad.value.password_nueva;
    const newPasswordConfirmation = this.formSeguridad.value.password_confirmacion;

    this.authService.changePassword(currentPassword, newPassword, newPasswordConfirmation).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Contraseña actualizada correctamente';
          this.formSeguridad.reset();
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Error al cambiar la contraseña';
        this.saving = false;
      }
    });
  }

  // Manejo de foto
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Previsualización
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      // Subir automáticamente
      this.subirFoto();
    }
  }

  subirFoto(): void {
    if (!this.selectedFile) return;

    this.saving = true;
    const formData = new FormData();
    formData.append('foto', this.selectedFile);

    this.authService.uploadPhoto(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.successMessage = 'Foto actualizada correctamente';
          if (this.usuario) {
            this.usuario.foto_url = response.data.foto_url;
          }
        }
        this.saving = false;
      },
      error: () => {
        this.error = 'Error al subir la foto';
        this.saving = false;
        this.previewUrl = null;
      }
    });
  }

  // Helpers
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get fotoUrl(): string {
    return this.previewUrl || this.usuario?.foto_url || `https://ui-avatars.com/api/?name=${this.usuario?.nombre} ${this.usuario?.apellido}&size=200`;
  }

  get nombreCompleto(): string {
    return `${this.usuario?.nombre || ''} ${this.usuario?.apellido || ''}`.trim();
  }

  calcularEdad(): number {
    if (!this.usuario?.paciente?.fecha_nacimiento) return 0;
    
    const hoy = new Date();
    const nacimiento = new Date(this.usuario.paciente.fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  verHistorialMedico(): void {
    this.router.navigate(['/paciente/historial-medico']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}