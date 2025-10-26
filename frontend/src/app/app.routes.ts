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
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
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
        path: 'medico',
        canActivate: [roleGuard],
        data: { role: 'medico' },
        loadComponent: () => import('./pages/dashboard/medico/medico-dashboard.component').then(m => m.MedicoDashboardComponent)
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { role: 'administrador' },
        loadComponent: () => import('./pages/dashboard/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];