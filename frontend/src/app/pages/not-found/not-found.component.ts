import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goHome(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      // Redirigir según el rol del usuario
      switch (currentUser.rol) {
        case 'paciente':
          this.router.navigate(['/paciente/dashboard']);
          break;
        case 'medico':
          this.router.navigate(['/medico/dashboard']);
          break;
        case 'administrador':
          this.router.navigate(['/admin/dashboard']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    } else {
      // Si no hay usuario logueado, ir a login
      this.router.navigate(['/login']);
    }
  }

  goBack(): void {
    window.history.back();
  }

  reportProblem(): void {
    // Aquí podrías abrir un modal o navegar a una página de soporte
    console.log('Reportar problema');
    alert('Esta funcionalidad estará disponible próximamente. Por favor, contacta al administrador del sistema.');
  }
}
