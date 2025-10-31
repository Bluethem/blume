import { Component } from '@angular/core';
import { PacienteFormComponent } from './paciente-form/paciente-form.component';

@Component({
  selector: 'app-crear-paciente',
  standalone: true,
  imports: [PacienteFormComponent],
  template: '<app-paciente-form></app-paciente-form>'
})
export class CrearPacienteComponent {}
