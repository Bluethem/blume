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
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      // Dashboard Paciente
      {
        path: 'paciente',
        canActivate: [roleGuard],
        data: { role: 'paciente' },
        loadComponent: () => import('./pages/dashboard/paciente/paciente-dashboard.component')
          .then(m => m.PacienteDashboardComponent)
      },
      /*
      // Dashboard Médico
      {
        path: 'medico',
        canActivate: [roleGuard],
        data: { role: 'medico' },
        loadComponent: () => import('./pages/dashboard/medico/medico-dashboard.component')
          .then(m => m.MedicoDashboardComponent)
      },

      // Dashboard Administrador
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { role: 'administrador' },
        loadComponent: () => import('./pages/dashboard/admin/admin-dashboard.component')
          .then(m => m.AdminDashboardComponent)
      }
      */
    ]
  },

  /*
  // ==================== RUTAS DE PACIENTE ====================
  {
    path: 'paciente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'paciente' },
    children: [
      // Mis Citas
      {
        path: 'citas',
        loadComponent: () => import('./pages/paciente/citas/paciente-citas.component')
          .then(m => m.PacienteCitasComponent)
      },
      // Detalle de Cita
      {
        path: 'citas/:id',
        loadComponent: () => import('./pages/paciente/citas/cita-detalle.component')
          .then(m => m.CitaDetalleComponent)
      },
      // Mi Perfil
      {
        path: 'perfil',
        loadComponent: () => import('./pages/paciente/perfil/perfil-paciente.component')
          .then(m => m.PerfilPacienteComponent)
      }
    ]
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