import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Guardar la URL a la que intentaba acceder
  console.log('Usuario no autenticado. Redirigiendo a login con returnUrl:', state.url);
  
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};