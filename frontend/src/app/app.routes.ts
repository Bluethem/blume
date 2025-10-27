import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  // Dashboards protegidos
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: 'paciente',
        canActivate: [roleGuard],
        data: { role: 'paciente' },
        loadComponent: () => import('./pages/dashboard/paciente/paciente-dashboard.component').then(m => m.PacienteDashboardComponent)
      },

      {
        path: 'dashboard/paciente',
        loadComponent: () => import('./pages/dashboard/paciente/paciente-dashboard.component')
          .then(m => m.DashboardPacienteComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: 'paciente' }
      },
      // Citas del Paciente
      {
        path: 'paciente/citas',
        loadComponent: () => import('./pages/paciente-citas/paciente-citas.component')
          .then(m => m.PacienteCitasComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: 'paciente' }
      },

      // Detalle de Cita
      {
        path: 'paciente/citas/:id',
        loadComponent: () => import('./pages/cita-detalle/cita-detalle.component')
          .then(m => m.CitaDetalleComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: 'paciente' }
      },

      // Lista de Médicos
      {
        path: 'medicos',
        loadComponent: () => import('./pages/medicos-lista/medicos-lista.component')
          .then(m => m.MedicosListaComponent),
        canActivate: [authGuard]
      },

      // Detalle del Médico
      {
        path: 'medicos/:id',
        loadComponent: () => import('./pages/medico-detalle/medico-detalle.component')
          .then(m => m.MedicoDetalleComponent),
        canActivate: [authGuard]
      },

      // Agendar Cita con Médico
      {
        path: 'medicos/:id/agendar',
        loadComponent: () => import('./pages/agendar-cita/agendar-cita.component')
          .then(m => m.AgendarCitaComponent),
        canActivate: [authGuard, roleGuard],
        data: { role: 'paciente' }
      },

      // Notificaciones
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/notificaciones/notificaciones.component')
          .then(m => m.NotificacionesComponent),
        canActivate: [authGuard]
      },

      // Perfil
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component')
          .then(m => m.PerfilComponent),
        canActivate: [authGuard]
      },

      // Redirect por defecto
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },

      // 404
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found.component')
          .then(m => m.NotFoundComponent)
      },

      {
        path: 'medico',
        canActivate: [roleGuard],
        data: { role: 'medico' },
        loadComponent: () => import('./pages/medico/dashboard-medico/medico-dashboard.component').then(m => m.MedicoDashboardComponent)
      },

      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { role: 'administrador' },
        loadComponent: () => import('./pages/admin/dashboard-admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];