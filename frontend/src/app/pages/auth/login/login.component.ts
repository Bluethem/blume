import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Capturar la URL de retorno si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    
    // Si ya está autenticado, redirigir al dashboard correspondiente
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard(this.authService.currentUserValue!);
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        const user = response.data.user;
        
        // Si hay una URL de retorno, ir ahí; si no, ir al dashboard
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectToDashboard(user);
        }
      },
      error: (error) => {
        this.errorMessage = error.message || 'Email o contraseña incorrectos';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Redirigir al dashboard correspondiente según el rol
   */
  private redirectToDashboard(user: any): void {
    switch (user.rol) {
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
        // Si el rol no es reconocido, ir a una página de error o logout
        this.authService.logout();
        this.errorMessage = 'Rol de usuario no válido. Contacta al administrador.';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}