import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const requiredRole = route.data['role'] as string;
  const user = authService.currentUserValue;
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    console.log('No hay usuario autenticado. Redirigiendo a login.');
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
  
  // Los administradores tienen acceso a todo
  if (user.rol === 'administrador') {
    console.log('Acceso concedido: Usuario es administrador');
    return true;
  }
  
  // Verificar si el usuario tiene el rol requerido
  if (user.rol === requiredRole) {
    console.log(`Acceso concedido: Usuario tiene rol ${requiredRole}`);
    return true;
  }
  
  // Si no tiene el rol correcto, redirigir a su dashboard
  console.log(`Acceso denegado: Usuario con rol ${user.rol} intentó acceder a ${requiredRole}`);
  
  switch (user.rol) {
    case 'paciente':
      return router.createUrlTree(['/dashboard/paciente']);
    case 'medico':
      return router.createUrlTree(['/dashboard/medico']);
    default:
      // Si el rol no es reconocido, cerrar sesión
      authService.logout();
      return router.createUrlTree(['/login']);
  }
};