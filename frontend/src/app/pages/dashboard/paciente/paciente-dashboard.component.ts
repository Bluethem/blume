import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Usuario } from '../../../models';

@Component({
  selector: 'app-paciente-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-card-light dark:bg-card-dark rounded-xl shadow-lg p-8">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Dashboard Paciente
            </h1>
            <button 
              (click)="logout()"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
          
          <div class="space-y-4">
            <p class="text-text-secondary-light dark:text-text-secondary-dark">
              Bienvenido, {{ currentUser?.nombre_completo }}
            </p>
            <p class="text-text-secondary-light dark:text-text-secondary-dark">
              Email: {{ currentUser?.email }}
            </p>
            <p class="text-text-secondary-light dark:text-text-secondary-dark">
              Rol: {{ currentUser?.rol }}
            </p>
            
            <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p class="text-blue-800 dark:text-blue-200">
                🚧 Dashboard en construcción...
              </p>
              <p class="text-sm text-blue-600 dark:text-blue-300 mt-2">
                Aquí podrás ver tus citas, agendar nuevas consultas y más.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PacienteDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: Usuario | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
  }

  logout(): void {
    this.authService.logout();
  }
}