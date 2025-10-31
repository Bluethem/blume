import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminAdministradoresService, Administrador } from '../../../services/admin-administradores.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-administradores-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './administradores-lista.component.html',
  styleUrls: ['./administradores-lista.component.css']
})
export class AdministradoresListaComponent implements OnInit {
  administradores: Administrador[] = [];
  loading = false;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  perPage = 10;
  
  // Selección múltiple
  selectedIds: Set<string> = new Set();
  selectAll = false;
  
  // Filtros
  rolFilter: 'all' | 'super_admin' | 'admin' = 'all';
  
  // Modal crear/editar
  showModal = false;
  editingAdmin: Administrador | null = null;
  
  // Form data
  formData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    password_confirmation: '',
    activo: true
  };
  submitting = false;
  formErrors: string[] = [];
  
  // Delete confirmation
  showDeleteConfirm = false;
  deletingId: string | null = null;

  // Math for template
  Math = Math;

  constructor(
    private administradoresService: AdminAdministradoresService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAdministradores();
    
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadAdministradores();
    });
  }

  loadAdministradores(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      per_page: this.perPage,
      search: this.searchTerm || undefined
    };

    if (this.rolFilter !== 'all') {
      params.rol = this.rolFilter;
    }

    this.administradoresService.getAdministradores(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.administradores = response.data.administradores;
          this.currentPage = response.data.meta.current_page;
          this.totalPages = response.data.meta.total_pages;
          this.totalCount = response.data.meta.total_count;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar administradores:', error);
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onRolFilterChange(rol: 'all' | 'super_admin' | 'admin'): void {
    this.rolFilter = rol;
    this.currentPage = 1;
    this.loadAdministradores();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAdministradores();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAdministradores();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAdministradores();
    }
  }

  openCreateModal(): void {
    this.editingAdmin = null;
    this.formData = {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      password: '',
      password_confirmation: '',
      activo: true
    };
    this.formErrors = [];
    this.showModal = true;
  }

  openEditModal(admin: Administrador): void {
    if (!admin.puede_editar) {
      alert('No tienes permisos para editar este administrador');
      return;
    }

    this.editingAdmin = admin;
    this.formData = {
      nombre: admin.nombre,
      apellido: admin.apellido,
      email: admin.email,
      telefono: admin.telefono || '',
      direccion: admin.direccion || '',
      password: '',
      password_confirmation: '',
      activo: admin.activo
    };
    this.formErrors = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingAdmin = null;
    this.formErrors = [];
  }

  saveAdministrador(): void {
    this.formErrors = [];

    // Validaciones
    if (!this.formData.nombre.trim()) {
      this.formErrors.push('El nombre es requerido');
    }
    if (!this.formData.apellido.trim()) {
      this.formErrors.push('El apellido es requerido');
    }
    if (!this.formData.email.trim()) {
      this.formErrors.push('El email es requerido');
    }
    
    if (!this.editingAdmin) {
      // Crear: password es requerido
      if (!this.formData.password) {
        this.formErrors.push('La contraseña es requerida');
      } else if (this.formData.password.length < 6) {
        this.formErrors.push('La contraseña debe tener al menos 6 caracteres');
      }
      if (this.formData.password !== this.formData.password_confirmation) {
        this.formErrors.push('Las contraseñas no coinciden');
      }
    } else {
      // Editar: password es opcional
      if (this.formData.password && this.formData.password.length < 6) {
        this.formErrors.push('La contraseña debe tener al menos 6 caracteres');
      }
      if (this.formData.password && this.formData.password !== this.formData.password_confirmation) {
        this.formErrors.push('Las contraseñas no coinciden');
      }
    }

    if (this.formErrors.length > 0) {
      return;
    }

    this.submitting = true;

    const data: any = {
      administrador: {
        nombre: this.formData.nombre,
        apellido: this.formData.apellido,
        email: this.formData.email,
        telefono: this.formData.telefono || undefined,
        direccion: this.formData.direccion || undefined,
        activo: this.formData.activo
      }
    };

    // Solo incluir password si se especificó
    if (this.formData.password) {
      data.administrador.password = this.formData.password;
      data.administrador.password_confirmation = this.formData.password_confirmation;
    }

    if (this.editingAdmin) {
      // Editar
      this.administradoresService.updateAdministrador(this.editingAdmin.id, data).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAdministradores();
            this.closeModal();
          } else {
            this.formErrors = response.errors || ['Error al actualizar'];
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.formErrors = error.error?.errors || ['Error al actualizar el administrador'];
          this.submitting = false;
        }
      });
    } else {
      // Crear
      this.administradoresService.createAdministrador(data).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAdministradores();
            this.closeModal();
          } else {
            this.formErrors = response.errors || ['Error al crear'];
          }
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error al crear:', error);
          this.formErrors = error.error?.errors || ['Error al crear el administrador'];
          this.submitting = false;
        }
      });
    }
  }

  verAdmin(id: string): void {
    this.router.navigate(['/admin/administradores/ver', id]);
  }

  confirmDelete(id: string): void {
    const admin = this.administradores.find(a => a.id === id);
    if (!admin?.puede_eliminar) {
      alert('No puedes eliminar este administrador');
      return;
    }

    this.deletingId = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingId = null;
  }

  deleteAdministrador(): void {
    if (!this.deletingId) return;

    this.administradoresService.deleteAdministrador(this.deletingId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAdministradores();
          this.cancelDelete();
        }
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert(error.error?.message || 'Error al eliminar el administrador');
        this.cancelDelete();
      }
    });
  }

  toggleEstado(admin: Administrador): void {
    if (!admin.puede_desactivar) {
      alert('No puedes cambiar el estado de este administrador');
      return;
    }

    this.administradoresService.toggleEstado(admin.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAdministradores();
        }
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado');
      }
    });
  }

  toggleSelect(id: string): void {
    const admin = this.administradores.find(a => a.id === id);
    
    // No permitir seleccionar super admin o el usuario actual
    if (admin && !admin.puede_eliminar) {
      return;
    }

    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.updateSelectAll();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.administradores
        .filter(admin => admin.puede_eliminar)
        .forEach(admin => this.selectedIds.add(admin.id));
    } else {
      this.selectedIds.clear();
    }
  }

  updateSelectAll(): void {
    const selectableAdmins = this.administradores.filter(a => a.puede_eliminar);
    this.selectAll = selectableAdmins.length > 0 && 
                     selectableAdmins.every(admin => this.selectedIds.has(admin.id));
  }

  bulkActivate(): void {
    if (this.selectedIds.size === 0) return;

    if (!confirm(`¿Activar ${this.selectedIds.size} administrador(es)?`)) return;

    this.administradoresService.bulkAction('activate', Array.from(this.selectedIds)).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedIds.clear();
          this.selectAll = false;
          this.loadAdministradores();
        }
      },
      error: (error) => {
        console.error('Error en acción masiva:', error);
        alert('Error al activar administradores');
      }
    });
  }

  bulkDeactivate(): void {
    if (this.selectedIds.size === 0) return;

    if (!confirm(`¿Desactivar ${this.selectedIds.size} administrador(es)?`)) return;

    this.administradoresService.bulkAction('deactivate', Array.from(this.selectedIds)).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedIds.clear();
          this.selectAll = false;
          this.loadAdministradores();
        }
      },
      error: (error) => {
        console.error('Error en acción masiva:', error);
        alert('Error al desactivar administradores');
      }
    });
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0) return;

    if (!confirm(`¿Eliminar ${this.selectedIds.size} administrador(es)? Esta acción no se puede deshacer.`)) return;

    this.administradoresService.bulkAction('delete', Array.from(this.selectedIds)).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedIds.clear();
          this.selectAll = false;
          this.loadAdministradores();
        }
      },
      error: (error) => {
        console.error('Error en acción masiva:', error);
        alert('Error al eliminar administradores');
      }
    });
  }

  getDisplayPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // Separator
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  isAdminSelectable(admin: Administrador): boolean {
    return admin.puede_eliminar;
  }
}
