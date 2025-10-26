import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  token: string = '';
  tokenValid = false;
  validatingToken = true;

  constructor() {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Obtener el token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.errorMessage = 'Token no proporcionado. Por favor solicita un nuevo enlace de recuperación.';
        this.validatingToken = false;
        return;
      }

      // Validar el token con el backend
      this.validateToken();
    });
  }

  validateToken(): void {
    this.validatingToken = true;
    
    // Aquí podrías hacer una llamada al backend para validar el token
    // Por ahora solo verificamos que exista
    if (this.token) {
      this.tokenValid = true;
      this.validatingToken = false;
    } else {
      this.tokenValid = false;
      this.validatingToken = false;
      this.errorMessage = 'Token inválido o expirado.';
    }
  }

  get password() {
    return this.resetPasswordForm.get('password');
  }

  get passwordConfirmation() {
    return this.resetPasswordForm.get('password_confirmation');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { password, password_confirmation } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token, password, password_confirmation).subscribe({
      next: (response) => {
        console.log('Reset password response:', response);
        this.isLoading = false;
        this.successMessage = 'Tu contraseña ha sido actualizada exitosamente.';
        this.resetPasswordForm.reset();
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error en reset password:', error);
        this.errorMessage = error.message || 'No se pudo restablecer la contraseña. El token puede haber expirado.';
        this.isLoading = false;
      },
      complete: () => {
        // El isLoading ya se pone en false en el next
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}