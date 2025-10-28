// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Usuario, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private currentUserSubject = new BehaviorSubject<Usuario | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private apiUrl = environment.apiUrl;

  constructor() {
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Login de usuario
   */
  login(email: string, password: string): Observable<AuthResponse> {
    const loginData: LoginRequest = {
      auth: { email, password }
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, loginData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data.token, response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Registro de nuevo usuario (paciente)
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, registerData).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data.token, response.data.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener perfil del usuario actual
   */
  getProfile(): Observable<ApiResponse<Usuario>> {
    return this.http.get<ApiResponse<Usuario>>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          this.saveUserToStorage(response.data);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar perfil
   */
  updateProfile(userData: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.apiUrl}/auth/update_profile`, { user: userData }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          this.saveUserToStorage(response.data);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Observable<ApiResponse> {
    const passwordData = {
      password: {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      }
    };
    
    return this.http.put<ApiResponse>(`${this.apiUrl}/auth/change_password`, passwordData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Solicitar reset de contraseña (Forgot Password)
   */
  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/forgot_password`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Resetear contraseña con token
   */
  resetPassword(token: string, password: string, passwordConfirmation: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/auth/reset_password`, {
      token,
      password,
      password_confirmation: passwordConfirmation
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * Obtener el usuario actual
   */
  get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.rol === role : false;
  }

  /**
   * Verificar si es paciente
   */
  isPaciente(): boolean {
    return this.hasRole('paciente');
  }

  /**
   * Verificar si es médico
   */
  isMedico(): boolean {
    return this.hasRole('medico');
  }

  /**
   * Verificar si es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('administrador');
  }

  /**
   * Guardar sesión (token y usuario)
   */
  private setSession(token: string, user: Usuario): void {
    localStorage.setItem(environment.tokenKey, token);
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Obtener usuario del storage
   */
  private getUserFromStorage(): Usuario | null {
    const userStr = localStorage.getItem(environment.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Guardar usuario en storage
   */
  private saveUserToStorage(user: Usuario): void {
    localStorage.setItem(environment.userKey, JSON.stringify(user));
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      // ✅ NUEVO: Error del backend en formato Rails
      errorMessage = error.error.error;
      
      // Si hay detalles de errores, concatenarlos
      if (error.error.errors && Array.isArray(error.error.errors)) {
        errorMessage += ': ' + error.error.errors.join(', ');
      }
    } else if (error.error?.message) {
      // Error del backend con mensaje
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      // Error de conexión
      errorMessage = 'No se pudo conectar con el servidor. Verifica que esté corriendo en http://localhost:3000';
    } else if (error.status === 401) {
      // No autorizado
      errorMessage = 'Sesión expirada o credenciales inválidas';
    } else if (error.status === 403) {
      // Prohibido
      errorMessage = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 404) {
      // No encontrado
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 422) {
      // Error de validación
      errorMessage = 'Error de validación en los datos enviados';
      if (error.error?.errors) {
        errorMessage += ': ' + error.error.errors.join(', ');
      }
    } else {
      // Otro error del servidor
      errorMessage = `Error: ${error.message}`;
    }

    return throwError(() => ({ 
      message: errorMessage, 
      status: error.status,
      errors: error.error?.errors 
    }));
  }

  /**
   * Subir foto de perfil
   */
  uploadPhoto(formData: FormData): Observable<ApiResponse<{ foto_url: string }>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/subir-foto`, formData);
  }
}