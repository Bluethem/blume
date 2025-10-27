import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.currentUserValue;
  const requiredRole = route.data['role'];

  if (currentUser && requiredRole) {
    // Verificar si el usuario tiene el rol requerido
    if (currentUser.rol === requiredRole) {
      return true;
    }

    // Si no tiene el rol, redirigir a su dashboard correspondiente
    console.log(`Usuario con rol ${currentUser.rol} intentando acceder a ruta de rol ${requiredRole}`);
    return redirectToDashboard(currentUser.rol, router);
  }

  // Si no hay usuario o rol requerido, redirigir al login
  console.log('No hay usuario o rol requerido. Redirigiendo a login');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

function redirectToDashboard(role: string, router: Router): UrlTree {
  switch (role) {
    case 'paciente':
      return router.createUrlTree(['/dashboard/paciente']);
    case 'medico':
      return router.createUrlTree(['/dashboard/medico']);
    case 'administrador':
      return router.createUrlTree(['/dashboard/admin']);
    default:
      return router.createUrlTree(['/login']);
  }
}