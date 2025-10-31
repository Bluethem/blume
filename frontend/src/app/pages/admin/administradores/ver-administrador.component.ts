import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminAdministradoresService, AdministradorDetalle } from '../../../services/admin-administradores.service';

@Component({
  selector: 'app-ver-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="w-full max-w-4xl mx-auto">
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()"
                class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Volver a lista</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>

      <!-- Admin Details -->
      <div *ngIf="!loading && admin" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-8">
          <div class="flex items-center gap-6">
            <!-- Avatar -->
            <img *ngIf="admin.foto_url; else avatarPlaceholder"
                 [src]="admin.foto_url"
                 [alt]="'Foto de ' + admin.nombre_completo"
                 class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
            <ng-template #avatarPlaceholder>
              <div class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                <span class="text-3xl font-bold text-primary">
                  {{ admin.nombre.charAt(0) }}{{ admin.apellido.charAt(0) }}
                </span>
              </div>
            </ng-template>

            <!-- Info -->
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {{ admin.nombre_completo }}
              </h1>
              <div class="flex items-center gap-3 flex-wrap">
                <span *ngIf="admin.es_super_admin" 
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <span class="material-symbols-outlined text-base">verified_user</span>
                  Super Administrador
                </span>
                <span *ngIf="!admin.es_super_admin"
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <span class="material-symbols-outlined text-base">admin_panel_settings</span>
                  Administrador
                </span>
                <span [class]="admin.activo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold">
                  <span class="w-2 h-2 rounded-full" [class]="admin.activo ? 'bg-green-600' : 'bg-red-600'"></span>
                  {{ admin.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button *ngIf="admin.puede_editar"
                      (click)="editAdmin()"
                      class="p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <span class="material-symbols-outlined text-gray-600 dark:text-gray-400">edit</span>
              </button>
              <button *ngIf="admin.puede_eliminar"
                      (click)="deleteAdmin()"
                      class="p-3 rounded-lg bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <span class="material-symbols-outlined text-red-600">delete</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">email</span>
                <p class="text-gray-900 dark:text-white">{{ admin.email }}</p>
              </div>
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">phone</span>
                <p class="text-gray-900 dark:text-white">{{ admin.telefono || 'No especificado' }}</p>
              </div>
            </div>

            <!-- Dirección -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Dirección</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">location_on</span>
                <p class="text-gray-900 dark:text-white">{{ admin.direccion || 'No especificada' }}</p>
              </div>
            </div>

            <!-- Fecha de Creación -->
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de Creación</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">calendar_today</span>
                <p class="text-gray-900 dark:text-white">{{ admin.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>

            <!-- Última Actualización -->
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Última Actualización</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">update</span>
                <p class="text-gray-900 dark:text-white">{{ admin.updated_at | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>

            <!-- Último Acceso -->
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Último Acceso</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">login</span>
                <p class="text-gray-900 dark:text-white">
                  {{ admin.ultimo_acceso ? (admin.ultimo_acceso | date:'dd/MM/yyyy HH:mm') : 'Nunca' }}
                </p>
              </div>
            </div>

            <!-- Creado Por -->
            <div *ngIf="admin.creado_por">
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Creado Por</label>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-gray-400">person</span>
                <p class="text-gray-900 dark:text-white">{{ admin.creado_por.nombre_completo }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <span class="material-symbols-outlined text-red-600 text-6xl mb-4">error</span>
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button (click)="goBack()"
                class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors">
          Volver a lista
        </button>
      </div>
    </div>
  `,
  styles: [`
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  `]
})
export class VerAdministradorComponent implements OnInit {
  admin: AdministradorDetalle | null = null;
  loading = false;
  error = '';
  adminId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private administradoresService: AdminAdministradoresService
  ) {}

  ngOnInit(): void {
    this.adminId = this.route.snapshot.params['id'];
    this.loadAdmin();
  }

  loadAdmin(): void {
    this.loading = true;
    this.error = '';

    this.administradoresService.getAdministrador(this.adminId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.admin = response.data;
        } else {
          this.error = 'No se pudo cargar el administrador';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar administrador:', error);
        this.error = error.error?.message || 'Error al cargar el administrador';
        this.loading = false;
      }
    });
  }

  editAdmin(): void {
    // Solo se puede editar el propio perfil, redirigir a /admin/perfil
    this.router.navigate(['/admin/perfil']);
  }

  deleteAdmin(): void {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;

    this.administradoresService.deleteAdministrador(this.adminId).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/admin/administradores']);
        }
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert(error.error?.message || 'Error al eliminar el administrador');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/administradores']);
  }
}
