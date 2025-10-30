import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface PacienteEditar {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  genero: string;
  tipo_documento: string;
  numero_documento: string;
  grupo_sanguineo?: string;
  alergias?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Component({
  selector: 'app-editar-paciente-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-paciente-modal.component.html',
  styleUrls: ['./editar-paciente-modal.component.css']
})
export class EditarPacienteModalComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  @Input() paciente: any;
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() pacienteActualizado = new EventEmitter<any>();

  form: FormGroup;
  guardando = false;
  mostrarConfirmacion = false;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      tipo_documento: ['dni', Validators.required],
      numero_documento: ['', Validators.required],
      grupo_sanguineo: [''],
      alergias: ['']
    });
  }

  ngOnChanges(): void {
    if (this.paciente && this.isOpen) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    // Extraer nombre y apellido del nombre completo
    const partes = this.paciente.nombre_completo.split(' ');
    const apellido = partes.pop() || '';
    const nombre = partes.join(' ');

    this.form.patchValue({
      nombre: nombre,
      apellido: apellido,
      email: this.paciente.email || '',
      telefono: this.paciente.telefono || '',
      fecha_nacimiento: this.paciente.fecha_nacimiento || '',
      genero: this.paciente.genero || '',
      tipo_documento: this.paciente.tipo_documento || 'dni',
      numero_documento: this.paciente.numero_documento || '',
      grupo_sanguineo: this.paciente.grupo_sanguineo || '',
      alergias: this.paciente.alergias || ''
    });
  }

  cerrar(): void {
    this.closeModal.emit();
  }

  guardarCambios(): void {
    if (this.form.invalid) {
      this.marcarCamposInvalidos();
      return;
    }

    this.guardando = true;
    const datos = this.form.value;

    // Construir el objeto para actualizar
    const actualizacion = {
      usuario: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono
      },
      paciente: {
        tipo_documento: datos.tipo_documento,
        numero_documento: datos.numero_documento,
        fecha_nacimiento: datos.fecha_nacimiento,
        genero: datos.genero,
        grupo_sanguineo: datos.grupo_sanguineo,
        alergias: datos.alergias
      }
    };

    this.http.put<ApiResponse<any>>(`${this.apiUrl}/medico/pacientes/${this.paciente.id}`, actualizacion)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.guardando = false;
            this.mostrarConfirmacion = true;
            setTimeout(() => {
              this.mostrarConfirmacion = false;
              this.pacienteActualizado.emit(response.data);
              this.cerrar();
            }, 2000);
          }
        },
        error: (error) => {
          this.guardando = false;
          alert('Error al actualizar paciente: ' + (error.error?.message || 'Error desconocido'));
        }
      });
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  get nombre() { return this.form.get('nombre'); }
  get apellido() { return this.form.get('apellido'); }
  get email() { return this.form.get('email'); }
  get telefono() { return this.form.get('telefono'); }
  get fecha_nacimiento() { return this.form.get('fecha_nacimiento'); }
  get genero() { return this.form.get('genero'); }
  get numero_documento() { return this.form.get('numero_documento'); }
}
