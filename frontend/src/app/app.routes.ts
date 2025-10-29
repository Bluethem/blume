import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Redirect inicial
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // ==================== RUTAS PÚBLICAS (AUTH) ====================
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },

  // ==================== DASHBOARDS PROTEGIDOS ====================
  {
    path: 'dashboard/paciente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'paciente' },
    loadComponent: () => import('./pages/dashboard/paciente/paciente-dashboard.component')
      .then(m => m.PacienteDashboardComponent)
  },

  // ==================== RUTAS DE PACIENTE ====================
  {
    path: 'paciente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'paciente' },
    loadComponent: () => import('./shared/layouts/paciente-layout/paciente-layout.component')
      .then(m => m.PacienteLayoutComponent),
    children: [
      {
        path: 'citas/medicos',
        loadComponent: () => import('./pages/paciente/citas/lista-medicos/lista-medicos.component')
          .then(m => m.ListaMedicosComponent)
      },
      {
        path: 'citas/medicos/:id/agendar',
        loadComponent: () => import('./pages/paciente/citas/agendar-cita-medico/agendar-cita-medico.component')
          .then(m => m.AgendarCitaMedicoComponent)
      },
      {
        path: 'citas/medicos/:id',
        loadComponent: () => import('./pages/paciente/citas/perfil-medico/perfil-medico.component')
          .then(m => m.PerfilMedicoComponent)
      },
      {
        path: 'citas/nueva',
        loadComponent: () => import('./pages/paciente/citas/agendar-cita/agendar-cita.component')
          .then(m => m.AgendarCitaComponent)
      },
      {
        path: 'citas/mis-citas',
        loadComponent: () => import('./pages/paciente/citas/mis-citas/mis-citas.component')
          .then(m => m.MisCitasComponent)
      },
      {
        path: 'citas/detalle/:id',
        loadComponent: () => import('./pages/paciente/citas/detalle-cita/detalle-cita.component')
          .then(m => m.DetalleCitaComponent)
      },
      {
        path: 'mi-perfil',
        loadComponent: () => import('./pages/paciente/mi-perfil/mi-perfil.component')
          .then(m => m.MiPerfilComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/paciente/notificaciones/notificaciones.component')
          .then(m => m.NotificacionesComponent)
      }
    ]
  }
  /*
  // ==================== DASHBOARDS DE MÉDICO Y ADMIN (NO IMPLEMENTADOS) ====================
  {
    path: 'dashboard/medico',
    canActivate: [authGuard, roleGuard],
    data: { role: 'medico' },
    loadComponent: () => import('./pages/dashboard/medico/medico-dashboard.component')
      .then(m => m.MedicoDashboardComponent)
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { role: 'administrador' },
    loadComponent: () => import('./pages/dashboard/admin/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent)
  },
  // ==================== RUTAS DE MÉDICOS (COMPARTIDAS) ====================
  {
    path: 'medicos',
    canActivate: [authGuard],
    children: [
      // Lista de Médicos
      {
        path: '',
        loadComponent: () => import('./pages/medicos/lista/medicos-lista.component')
          .then(m => m.MedicosListaComponent)
      },
      // Detalle del Médico
      {
        path: ':id',
        loadComponent: () => import('./pages/medicos/detalle/medico-detalle.component')
          .then(m => m.MedicoDetalleComponent)
      },
      // Agendar Cita con Médico
      {
        path: ':id/agendar',
        loadComponent: () => import('./pages/medicos/agendar/agendar-cita.component')
          .then(m => m.AgendarCitaComponent)
      }
    ]
  },

  // ==================== NOTIFICACIONES (COMPARTIDA) ====================
  {
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/notificaciones/notificaciones.component')
      .then(m => m.NotificacionesComponent)
  },

  // ==================== 404 ====================
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
  */
];