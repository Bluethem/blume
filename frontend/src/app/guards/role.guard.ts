import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    const requiredRole = route.data['role'];

    if (currentUser && requiredRole) {
      // Verificar si el usuario tiene el rol requerido
      if (currentUser.rol === requiredRole) {
        return true;
      }

      // Si no tiene el rol, redirigir a su dashboard correspondiente
      this.redirectToDashboard(currentUser.rol);
      return false;
    }

    // Si no hay usuario o rol requerido, redirigir al login
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'paciente':
        this.router.navigate(['/dashboard/paciente']);
        break;
      case 'medico':
        this.router.navigate(['/dashboard/medico']);
        break;
      case 'administrador':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}