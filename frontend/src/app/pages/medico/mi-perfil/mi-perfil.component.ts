import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface PerfilMedico {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  foto_url?: string;
  numero_colegiatura: string;
  especialidad: string;
  anios_experiencia: number;
  biografia?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  perfil: PerfilMedico | null = null;
  loading = false;
  guardando = false;
  cambiosPendientes = false;

  // Tabs
  tabActivo: string = 'personal';
  tabs = [
    { id: 'personal', label: 'Información Personal' },
    { id: 'horarios', label: 'Horarios de Atención' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'certificaciones', label: 'Certificaciones' }
  ];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      telefono: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{9,15}$/)]],
      numero_colegiatura: ['', Validators.required],
      especialidad: [{ value: '', disabled: true }],
      anios_experiencia: [0, [Validators.required, Validators.min(0)]],
      biografia: ['']
    });
    
    // Detectar cambios en el formulario
    this.form.valueChanges.subscribe(() => {
      this.cambiosPendientes = this.form.dirty;
    });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.loading = true;
    this.http.get<ApiResponse<PerfilMedico>>(`${this.apiUrl}/medico/perfil`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.perfil = response.data;
          this.cargarDatosEnFormulario();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  cargarDatosEnFormulario(): void {
    if (this.perfil) {
      this.form.patchValue({
        nombre: this.perfil.nombre,
        apellido: this.perfil.apellido,
        email: this.perfil.email,
        telefono: this.perfil.telefono,
        numero_colegiatura: this.perfil.numero_colegiatura,
        especialidad: this.perfil.especialidad,
        anios_experiencia: this.perfil.anios_experiencia,
        biografia: this.perfil.biografia || ''
      });
    }
  }

  cambiarTab(tabId: string): void {
    // Redirigir a módulo existente si es necesario
    if (tabId === 'horarios') {
      if (this.confirmarCambiosSinGuardar()) {
        this.router.navigate(['/medico/horarios']);
      }
      return;
    }
    
    this.tabActivo = tabId;
  }

  cambiarFoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('La imagen no debe superar los 5MB');
          return;
        }
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
          alert('Por favor selecciona una imagen válida');
          return;
        }
        
        // TODO: Implementar subida al servidor
        const reader = new FileReader();
        reader.onload = (event: any) => {
          // Mostrar preview temporal
          if (this.perfil) {
            this.perfil.foto_url = event.target.result;
          }
          alert('Subida de foto al servidor pendiente de implementación');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  guardarCambios(): void {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();
      alert('Por favor corrige los errores en el formulario');
      return;
    }

    this.guardando = true;
    const datos = this.form.getRawValue();

    this.http.put<ApiResponse<PerfilMedico>>(`${this.apiUrl}/medico/perfil`, { medico: datos }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.perfil = response.data;
          this.form.markAsPristine();
          this.cambiosPendientes = false;
          alert('✅ Perfil actualizado exitosamente');
        }
        this.guardando = false;
      },
      error: (error) => {
        this.guardando = false;
        alert('❌ Error al actualizar perfil: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }
  
  confirmarCambiosSinGuardar(): boolean {
    if (this.cambiosPendientes) {
      return confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardar?');
    }
    return true;
  }
  
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.cambiosPendientes) {
      $event.returnValue = true;
    }
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  get nombre() { return this.form.get('nombre'); }
  get apellido() { return this.form.get('apellido'); }
  get telefono() { return this.form.get('telefono'); }
  get numero_colegiatura() { return this.form.get('numero_colegiatura'); }
  get especialidad() { return this.form.get('especialidad'); }
  get anios_experiencia() { return this.form.get('anios_experiencia'); }
  get biografia() { return this.form.get('biografia'); }
}
