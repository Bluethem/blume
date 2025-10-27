// src/app/pages/forgot-password/forgot-password.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  forgotPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.email?.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email } = this.forgotPasswordForm.value;

    // Llamada real al backend
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        console.log('Forgot password response:', response);
        this.isLoading = false;
        this.successMessage = 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
        this.forgotPasswordForm.reset();
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error en forgot password:', error);
        this.errorMessage = error.message || 'No se pudo enviar el correo de recuperación.';
        this.isLoading = false;
      },
      complete: () => {
        // El isLoading ya se pone en false en el next
      }
    });
  }
}