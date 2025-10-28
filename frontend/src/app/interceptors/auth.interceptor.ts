import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  // Clonar la petición y agregar el header de autorización si existe token
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Enviar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error) => {
      // Si es error 401 (no autorizado), redirigir al login UNA SOLA VEZ
      if (error.status === 401) {
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Solo redirigir si NO estamos ya en login
        const currentUrl = router.url;
        if (!currentUrl.includes('/login')) {
          router.navigate(['/login']);
        }
      }
      
      // Si es error 403 (prohibido), mostrar mensaje
      if (error.status === 403) {
        console.error('Acceso prohibido. No tienes permisos.');
      }

      // Propagar el error SIN reintentar
      return throwError(() => error);
    })
  );
};