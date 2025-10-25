import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Selector de rol en el primer paso
  selectedRole: 'paciente' | 'medico' = 'paciente';
  
  currentStep = 1;
  maxStep = 3; // Cambiará a 4 si es médico
  isLoading = false;
  errorMessage = '';

  // Formulario paso 0: Selección de Rol (NUEVO)
  step0Form: FormGroup;
  
  // Formulario paso 1: Información Personal
  step1Form: FormGroup;
  
  // Formulario paso 2: Información Médica (Paciente) o Profesional (Médico)
  step2Form: FormGroup;
  
  // Formulario paso 3: Documentos Médicos (solo si es médico)
  step3FormMedico: FormGroup;
  
  // Formulario paso final: Seguridad (llamado step3Form para compatibilidad)
  step3Form: FormGroup;

  constructor() {
    // Paso 0: Selección de Rol
    this.step0Form = this.fb.group({
      rol: ['paciente', Validators.required]
    });

    // Paso 1: Información Personal
    this.step1Form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{9,15}$/)]],
      direccion: ['', Validators.required]
    });

    // Paso 2: Varía según el rol
    this.step2Form = this.fb.group({
      // Campos comunes
      fecha_nacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      tipo_documento: ['', Validators.required],
      numero_documento: ['', [Validators.required, Validators.minLength(8)]],
      
      // Campos solo para paciente
      grupo_sanguineo: [''],
      alergias: [''],
      
      // Campos solo para médico
      numero_colegiatura: [''],
      anos_experiencia: [''],
      especialidades: [''],
      tarifa_consulta: [''],
      biografia: ['']
    });

    // Paso 3: Solo para médicos - Documentos
    this.step3FormMedico = this.fb.group({
      certificados: [''],
      cv: ['']
    });

    // Paso final: Seguridad
    this.step3Form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required],
      terminos: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });

    // Escuchar cambios en el rol
    this.step0Form.get('rol')?.valueChanges.subscribe(rol => {
      this.selectedRole = rol;
      this.updateStep2Validators();
      this.updateMaxStep();
    });
  }

  // Actualizar validadores del paso 2 según el rol
  updateStep2Validators(): void {
    const grupoSanguineo = this.step2Form.get('grupo_sanguineo');
    const alergias = this.step2Form.get('alergias');
    const numeroColegiatura = this.step2Form.get('numero_colegiatura');
    const anosExperiencia = this.step2Form.get('anos_experiencia');
    const especialidades = this.step2Form.get('especialidades');
    const tarifaConsulta = this.step2Form.get('tarifa_consulta');

    if (this.selectedRole === 'paciente') {
      // Paciente: campos médicos opcionales
      grupoSanguineo?.clearValidators();
      alergias?.clearValidators();
      
      // Médico: campos obligatorios se limpian
      numeroColegiatura?.clearValidators();
      anosExperiencia?.clearValidators();
      especialidades?.clearValidators();
      tarifaConsulta?.clearValidators();
    } else if (this.selectedRole === 'medico') {
      // Paciente: campos se limpian
      grupoSanguineo?.clearValidators();
      alergias?.clearValidators();
      
      // Médico: campos obligatorios
      numeroColegiatura?.setValidators([Validators.required]);
      anosExperiencia?.setValidators([Validators.required, Validators.min(0)]);
      especialidades?.setValidators([Validators.required]);
      tarifaConsulta?.setValidators([Validators.required, Validators.min(0)]);
    }

    // Actualizar validación
    Object.keys(this.step2Form.controls).forEach(key => {
      this.step2Form.get(key)?.updateValueAndValidity();
    });
  }

  // Actualizar número máximo de pasos
  updateMaxStep(): void {
    this.maxStep = this.selectedRole === 'medico' ? 4 : 3;
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

  // Navegación entre pasos
  nextStep(): void {
    const currentForm = this.getCurrentForm();
    
    if (currentForm.valid) {
      if (this.currentStep < this.maxStep) {
        this.currentStep++;
        this.errorMessage = '';
      }
    } else {
      this.markFormGroupTouched(currentForm);
      this.errorMessage = 'Por favor completa todos los campos requeridos.';
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  getCurrentForm(): FormGroup {
    if (this.selectedRole === 'paciente') {
      switch (this.currentStep) {
        case 0: return this.step0Form;
        case 1: return this.step1Form;
        case 2: return this.step2Form;
        case 3: return this.step3Form;
        default: return this.step0Form;
      }
    } else {
      // Médico tiene un paso extra
      switch (this.currentStep) {
        case 0: return this.step0Form;
        case 1: return this.step1Form;
        case 2: return this.step2Form;
        case 3: return this.step3FormMedico;
        case 4: return this.step3Form;
        default: return this.step0Form;
      }
    }
  }

  // Submit final del registro
  onSubmit(): void {
    const finalForm = this.step3Form;
    
    if (finalForm.invalid) {
      this.markFormGroupTouched(finalForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.selectedRole === 'paciente') {
      this.registerPaciente();
    } else {
      this.registerMedico();
    }
  }

  registerPaciente(): void {
    const registerData: RegisterRequest = {
      auth: {
        email: this.step1Form.value.email,
        password: this.step3Form.value.password,
        password_confirmation: this.step3Form.value.password_confirmation,
        nombre: this.step1Form.value.nombre,
        apellido: this.step1Form.value.apellido,
        telefono: this.step1Form.value.telefono,
        direccion: this.step1Form.value.direccion
      },
      fecha_nacimiento: this.step2Form.value.fecha_nacimiento,
      genero: this.step2Form.value.genero,
      tipo_documento: this.step2Form.value.tipo_documento,
      numero_documento: this.step2Form.value.numero_documento,
      rol: 'paciente'
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro de paciente exitoso:', response);
        this.router.navigate(['/dashboard/paciente']);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.errorMessage = error.message || 'Error al crear la cuenta.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  registerMedico(): void {
    // TODO: Implementar endpoint específico para médicos en el backend
    // Por ahora muestra mensaje
    alert('🩺 Registro de médico\n\n' +
          'Tu solicitud será enviada al administrador para su aprobación.\n' +
          'Recibirás un correo cuando tu cuenta sea activada.\n\n' +
          'Datos:\n' +
          `- Colegiatura: ${this.step2Form.value.numero_colegiatura}\n` +
          `- Experiencia: ${this.step2Form.value.anos_experiencia} años\n` +
          `- Especialidades: ${this.step2Form.value.especialidades}`
    );
    
    this.isLoading = false;
    this.router.navigate(['/login']);
    
    /* 
    // Cuando implementes el endpoint en el backend:
    const medicoData = {
      auth: {
        email: this.step1Form.value.email,
        password: this.step3Form.value.password,
        password_confirmation: this.step3Form.value.password_confirmation,
        nombre: this.step1Form.value.nombre,
        apellido: this.step1Form.value.apellido,
        telefono: this.step1Form.value.telefono,
        direccion: this.step1Form.value.direccion
      },
      fecha_nacimiento: this.step2Form.value.fecha_nacimiento,
      genero: this.step2Form.value.genero,
      tipo_documento: this.step2Form.value.tipo_documento,
      numero_documento: this.step2Form.value.numero_documento,
      rol: 'medico',
      medico: {
        numero_colegiatura: this.step2Form.value.numero_colegiatura,
        anos_experiencia: this.step2Form.value.anos_experiencia,
        especialidades: this.step2Form.value.especialidades,
        tarifa_consulta: this.step2Form.value.tarifa_consulta,
        biografia: this.step2Form.value.biografia
      }
    };
    
    this.authService.registerMedico(medicoData).subscribe({
      next: (response) => {
        alert('Solicitud enviada al administrador');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
    */
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}