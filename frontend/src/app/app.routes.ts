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
  // Redirect del antiguo dashboard a la nueva ubicación
  {
    path: 'dashboard/paciente',
    redirectTo: '/paciente/dashboard',
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

  // ==================== RUTAS DE PACIENTE ====================
  {
    path: 'paciente',
    canActivate: [authGuard, roleGuard],
    data: { role: 'paciente' },
    loadComponent: () => import('./shared/layouts/paciente-layout/paciente-layout.component')
      .then(m => m.PacienteLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/paciente/paciente-dashboard.component')
          .then(m => m.PacienteDashboardComponent)
      },
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
        path: 'pago/:id',
        loadComponent: () => import('./pages/paciente/citas/detalle-pago/detalle-pago.component')
          .then(m => m.DetallePagoComponent)
      },
      {
        path: 'citas/pagar/:id',
        loadComponent: () => import('./pages/paciente/citas/pagar-cita/pagar-cita.component')
          .then(m => m.PagarCitaComponent)
      },
      {
        path: 'mi-perfil',
        loadComponent: () => import('./pages/paciente/mi-perfil/mi-perfil.component')
          .then(m => m.MiPerfilComponent)
      },
      {
        path: 'mi-perfil/historial-medico',
        loadComponent: () => import('./pages/paciente/mi-perfil/historial-medico/historial-medico.component')
          .then(m => m.HistorialMedicoComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/paciente/notificaciones/notificaciones.component')
          .then(m => m.NotificacionesComponent)
      },
      {
        path: 'pagos',
        loadComponent: () => import('./modules/paciente/components/historial-pagos/historial-pagos.component')
          .then(m => m.HistorialPagosComponent)
      },
      {
        path: 'reprogramaciones',
        loadComponent: () => import('./modules/paciente/components/lista-reprogramaciones/lista-reprogramaciones.component')
          .then(m => m.ListaReprogramacionesComponent)
      }
    ]
  },

  // ==================== DASHBOARD DE MÉDICO ====================
  {
    path: 'medico',
    canActivate: [authGuard, roleGuard],
    data: { role: 'medico' },
    loadComponent: () => import('./shared/layouts/medico-layout/medico-layout.component')
      .then(m => m.MedicoLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/medico/medico-dashboard.component')
          .then(m => m.MedicoDashboardComponent)
      },
      {
        path: 'citas',
        loadComponent: () => import('./pages/medico/citas/mis-citas/mis-citas.component')
          .then(m => m.MisCitasComponent)
      },
      {
        path: 'citas/detalle/:id',
        loadComponent: () => import('./pages/medico/citas/detalle-cita/detalle-cita.component')
          .then(m => m.DetalleCitaComponent)
      },
      {
        path: 'citas/:id/agregar-costo-adicional',
        loadComponent: () => import('./pages/medico/citas/agregar-costo-adicional/agregar-costo-adicional.component')
          .then(m => m.AgregarCostoAdicionalComponent)
      },
      {
        path: 'citas/atender/:id',
        loadComponent: () => import('./pages/medico/citas/atender-cita/atender-cita.component')
          .then(m => m.AtenderCitaComponent)
      },
      {
        path: 'citas/agendar',
        loadComponent: () => import('./pages/medico/citas/agendar-cita/agendar-cita.component')
          .then(m => m.AgendarCitaComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/medico/pacientes/mis-pacientes/mis-pacientes.component')
          .then(m => m.MisPacientesComponent)
      },
      {
        path: 'pacientes/:id',
        loadComponent: () => import('./pages/medico/pacientes/detalle-paciente/detalle-paciente.component')
          .then(m => m.DetallePacienteComponent)
      },
      {
        path: 'horarios',
        loadComponent: () => import('./pages/medico/horarios/gestion-horarios/gestion-horarios.component')
          .then(m => m.GestionHorariosComponent)
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./pages/medico/estadisticas/mis-estadisticas/mis-estadisticas.component')
          .then(m => m.MisEstadisticasComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/medico/mi-perfil/mi-perfil.component')
          .then(m => m.MiPerfilComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/medico/notificaciones/notificaciones.component')
          .then(m => m.NotificacionesComponent)
      },
      {
        path: 'reprogramaciones',
        loadComponent: () => import('./modules/paciente/components/lista-reprogramaciones/lista-reprogramaciones.component')
          .then(m => m.ListaReprogramacionesComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ==================== DASHBOARD ADMIN ====================
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { role: 'administrador' },
    loadComponent: () => import('./pages/admin/admin-layout/admin-layout.component')
      .then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'medicos',
        loadComponent: () => import('./pages/admin/medicos/medicos-lista.component')
          .then(m => m.MedicosListaComponent)
      },
      {
        path: 'medicos/crear',
        loadComponent: () => import('./pages/admin/medicos/crear-medico.component')
          .then(m => m.CrearMedicoComponent)
      },
      {
        path: 'medicos/ver/:id',
        loadComponent: () => import('./pages/admin/medicos/ver-medico.component')
          .then(m => m.VerMedicoComponent)
      },
      {
        path: 'medicos/editar/:id',
        loadComponent: () => import('./pages/admin/medicos/editar-medico.component')
          .then(m => m.EditarMedicoComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () => import('./pages/admin/pacientes/pacientes-lista.component')
          .then(m => m.PacientesListaComponent)
      },
      {
        path: 'pacientes/crear',
        loadComponent: () => import('./pages/admin/pacientes/crear-paciente.component')
          .then(m => m.CrearPacienteComponent)
      },
      {
        path: 'pacientes/editar/:id',
        loadComponent: () => import('./pages/admin/pacientes/editar-paciente.component')
          .then(m => m.EditarPacienteComponent)
      },
      {
        path: 'pacientes/ver/:id',
        loadComponent: () => import('./pages/admin/pacientes/ver-paciente.component')
          .then(m => m.VerPacienteComponent)
      },
      {
        path: 'certificaciones',
        loadComponent: () => import('./pages/admin/certificaciones/certificaciones-lista.component')
          .then(m => m.CertificacionesListaComponent)
      },
      {
        path: 'administradores',
        loadComponent: () => import('./pages/admin/administradores/administradores-lista.component')
          .then(m => m.AdministradoresListaComponent)
      },
      {
        path: 'administradores/ver/:id',
        loadComponent: () => import('./pages/admin/administradores/ver-administrador.component')
          .then(m => m.VerAdministradorComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/admin/reportes/reportes.component')
          .then(m => m.ReportesComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/admin/configuracion/configuracion.component')
          .then(m => m.ConfiguracionComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/admin/perfil/perfil.component')
          .then(m => m.AdminPerfilComponent)
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/admin/notificaciones/notificaciones.component')
          .then(m => m.AdminNotificacionesComponent)
      },
      {
        path: 'citas',
        loadComponent: () => import('./pages/admin/citas/citas.component')
          .then(m => m.AdminCitasComponent)
      },
      {
        path: 'citas/ver/:id',
        loadComponent: () => import('./pages/admin/citas/ver-cita.component')
          .then(m => m.VerCitaComponent)
      },
      {
        path: 'citas/nueva',
        loadComponent: () => import('./pages/admin/citas/form-cita.component')
          .then(m => m.FormCitaComponent)
      },
      {
        path: 'citas/editar/:id',
        loadComponent: () => import('./pages/admin/citas/form-cita.component')
          .then(m => m.FormCitaComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ==================== 404 - PÁGINA NO ENCONTRADA ====================
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];