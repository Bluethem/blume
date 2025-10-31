import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPerfilService, PerfilAdmin } from '../../../services/admin-perfil.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class AdminPerfilComponent implements OnInit {
  loading = false;
  perfil: PerfilAdmin | null = null;

  // Tabs
  tabActual: 'informacion' | 'seguridad' = 'informacion';

  // Form data
  formData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: ''
  };

  // Password form
  passwordData = {
    password_actual: '',
    password_nuevo: '',
    password_confirmacion: ''
  };

  // Estados
  guardando = false;
  cambiandoPassword = false;
  mensajeExito = '';
  mensajeError = '';
  mensajePassword = '';
  errorPassword = '';

  constructor(
    private perfilService: AdminPerfilService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPerfil();
  }

  loadPerfil(): void {
    this.loading = true;
    this.perfilService.getPerfil().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.perfil = response.data;
          this.formData = {
            nombre: this.perfil.nombre,
            apellido: this.perfil.apellido,
            email: this.perfil.email,
            telefono: this.perfil.telefono || '',
            direccion: this.perfil.direccion || ''
          };
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.loading = false;
      }
    });
  }

  cambiarTab(tab: 'informacion' | 'seguridad'): void {
    this.tabActual = tab;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.mensajePassword = '';
    this.errorPassword = '';
  }

  guardarPerfil(): void {
    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.perfilService.updatePerfil({ perfil: this.formData }).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Perfil actualizado exitosamente';
          this.loadPerfil();
          
          // Actualizar datos del usuario en el AuthService
          const currentUser = this.authService.currentUserValue;
          if (currentUser && response.data) {
            currentUser.nombre = response.data.nombre;
            currentUser.apellido = response.data.apellido;
            currentUser.email = response.data.email;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        } else {
          this.mensajeError = response.message || 'Error al actualizar el perfil';
        }
        this.guardando = false;
        this.scrollToTop();
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.mensajeError = error.error?.message || 'Error al actualizar el perfil';
        this.guardando = false;
        this.scrollToTop();
      }
    });
  }

  cambiarPassword(): void {
    this.errorPassword = '';
    this.mensajePassword = '';

    // Validaciones
    if (!this.passwordData.password_actual) {
      this.errorPassword = 'Ingresa tu contraseña actual';
      return;
    }

    if (!this.passwordData.password_nuevo) {
      this.errorPassword = 'Ingresa tu nueva contraseña';
      return;
    }

    if (this.passwordData.password_nuevo.length < 6) {
      this.errorPassword = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.passwordData.password_nuevo !== this.passwordData.password_confirmacion) {
      this.errorPassword = 'Las contraseñas nuevas no coinciden';
      return;
    }

    this.cambiandoPassword = true;

    this.perfilService.cambiarPassword(this.passwordData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajePassword = 'Contraseña actualizada exitosamente';
          this.passwordData = {
            password_actual: '',
            password_nuevo: '',
            password_confirmacion: ''
          };
        } else {
          this.errorPassword = response.message || 'Error al cambiar la contraseña';
        }
        this.cambiandoPassword = false;
        this.scrollToTop();
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        this.errorPassword = error.error?.message || 'Error al cambiar la contraseña';
        this.cambiandoPassword = false;
        this.scrollToTop();
      }
    });
  }

  subiendoFoto = false;

  subirFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG)');
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es muy grande. Tamaño máximo: 5MB');
        return;
      }

      this.subiendoFoto = true;
      this.perfilService.subirFoto(file).subscribe({
        next: (response) => {
          if (response.success) {
            this.mensajeExito = 'Foto actualizada exitosamente';
            this.loadPerfil();
            
            // Actualizar foto en el AuthService
            const currentUser = this.authService.currentUserValue;
            if (currentUser && response.data) {
              currentUser.foto_url = response.data.foto_url;
              localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
          } else {
            this.mensajeError = response.message || 'Error al subir la foto';
          }
          this.subiendoFoto = false;
          this.scrollToTop();
        },
        error: (error) => {
          console.error('Error al subir foto:', error);
          this.mensajeError = error.error?.message || 'Error al subir la foto';
          this.subiendoFoto = false;
          this.scrollToTop();
        }
      });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get esSuperAdmin(): boolean {
    return this.perfil?.es_super_admin === true;
  }

  get iniciales(): string {
    if (!this.perfil) return 'AD';
    return `${this.perfil.nombre.charAt(0)}${this.perfil.apellido.charAt(0)}`.toUpperCase();
  }
}
