import { Injectable, effect, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal para el estado del dark mode
  private darkModeSignal = signal<boolean>(false);
  
  // Getter público para el dark mode
  public isDarkMode = this.darkModeSignal.asReadonly();

  constructor() {
    // Inicializar el tema desde localStorage o preferencia del sistema
    this.initializeTheme();
    
    // Effect para aplicar cambios cuando cambia el tema
    effect(() => {
      const isDark = this.darkModeSignal();
      this.applyTheme(isDark);
    });
  }

  /**
   * Inicializar el tema desde localStorage o preferencia del sistema
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('blume-theme');
    
    if (savedTheme) {
      // Si hay tema guardado, usarlo
      this.darkModeSignal.set(savedTheme === 'dark');
    } else {
      // Si no, detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkModeSignal.set(prefersDark);
      localStorage.setItem('blume-theme', prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Aplicar el tema al documento
   */
  private applyTheme(isDark: boolean): void {
    const htmlElement = document.documentElement;
    
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // Guardar en localStorage
    localStorage.setItem('blume-theme', isDark ? 'dark' : 'light');
  }

  /**
   * Alternar entre light y dark mode
   */
  public toggleTheme(): void {
    this.darkModeSignal.update(current => !current);
  }

  /**
   * Establecer el tema directamente
   */
  public setTheme(isDark: boolean): void {
    this.darkModeSignal.set(isDark);
  }

  /**
   * Obtener el tema actual como string
   */
  public getCurrentTheme(): 'light' | 'dark' {
    return this.darkModeSignal() ? 'dark' : 'light';
  }

  /**
   * Escuchar cambios en la preferencia del sistema
   */
  public watchSystemPreference(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Solo actualizar si el usuario no ha establecido una preferencia manualmente
      const savedTheme = localStorage.getItem('blume-theme');
      if (!savedTheme) {
        this.darkModeSignal.set(e.matches);
      }
    });
  }
}