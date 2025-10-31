import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminConfiguracionService, Configuracion } from '../../../services/admin-configuracion.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  loading = false;
  configuraciones: Configuracion[] = [];
  porCategoria: { [key: string]: Configuracion[] } = {};
  esSuperAdmin = false;
  
  // Tab actual
  tabActual: 'general' | 'citas' | 'permisos' | 'integraciones' | 'apariencia' = 'general';

  // Configuraciones editables (valores locales)
  valores: { [key: string]: any } = {};
  
  // Días festivos
  diasFestivos: string[] = [];
  nuevoDiaFestivo = '';

  // Estados de guardado
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private configuracionService: AdminConfiguracionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.esSuperAdmin = user?.es_super_admin === true;
    this.loadConfiguraciones();
  }

  loadConfiguraciones(): void {
    this.loading = true;
    this.configuracionService.getConfiguraciones().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.configuraciones = response.data.configuraciones;
          this.porCategoria = response.data.por_categoria;
          this.esSuperAdmin = response.data.es_super_admin;
          
          // Inicializar valores locales
          this.configuraciones.forEach(config => {
            this.valores[config.clave] = config.valor;
          });

          // Parsear días festivos
          const diasFestivosConfig = this.configuraciones.find(c => c.clave === 'sistema_dias_festivos');
          if (diasFestivosConfig && Array.isArray(diasFestivosConfig.valor)) {
            this.diasFestivos = diasFestivosConfig.valor;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuraciones:', error);
        this.loading = false;
      }
    });
  }

  cambiarTab(tab: 'general' | 'citas' | 'permisos' | 'integraciones' | 'apariencia'): void {
    this.tabActual = tab;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  getConfiguracionesPorCategoria(categoria: string): Configuracion[] {
    return this.porCategoria[categoria] || [];
  }

  agregarDiaFestivo(): void {
    if (this.nuevoDiaFestivo.trim()) {
      this.diasFestivos.push(this.nuevoDiaFestivo);
      this.valores['sistema_dias_festivos'] = this.diasFestivos;
      this.nuevoDiaFestivo = '';
    }
  }

  eliminarDiaFestivo(index: number): void {
    this.diasFestivos.splice(index, 1);
    this.valores['sistema_dias_festivos'] = this.diasFestivos;
  }

  guardarCategoria(): void {
    this.guardando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const configuracionesActuales = this.getConfiguracionesPorCategoria(this.tabActual);
    const updates = configuracionesActuales
      .filter(config => config.puede_modificar)
      .map(config => ({
        clave: config.clave,
        valor: this.valores[config.clave]
      }));

    if (updates.length === 0) {
      this.guardando = false;
      this.mensajeError = 'No hay cambios para guardar';
      return;
    }

    this.configuracionService.batchUpdate({ configuraciones: updates }).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = 'Configuración guardada exitosamente';
          this.loadConfiguraciones();
        } else {
          this.mensajeError = response.message || 'Error al guardar';
        }
        this.guardando = false;
        this.scrollToTop();
      },
      error: (error) => {
        console.error('Error al guardar:', error);
        this.mensajeError = 'Error al guardar la configuración';
        this.guardando = false;
        this.scrollToTop();
      }
    });
  }

  restablecerCategoria(): void {
    if (!confirm('¿Estás seguro de restablecer esta categoría a sus valores por defecto?')) {
      return;
    }

    this.configuracionService.restablecer(this.tabActual).subscribe({
      next: (response) => {
        if (response.success) {
          this.mensajeExito = response.message || 'Configuración restablecida';
          this.loadConfiguraciones();
        } else {
          this.mensajeError = 'Error al restablecer';
        }
        this.scrollToTop();
      },
      error: (error) => {
        console.error('Error al restablecer:', error);
        this.mensajeError = 'Error al restablecer configuración';
        this.scrollToTop();
      }
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  get puedeVerPermisos(): boolean {
    return this.esSuperAdmin;
  }

  get puedeVerIntegraciones(): boolean {
    return this.esSuperAdmin;
  }

  get categoriaActualTieneConfiguraciones(): boolean {
    return this.getConfiguracionesPorCategoria(this.tabActual).length > 0;
  }
}
