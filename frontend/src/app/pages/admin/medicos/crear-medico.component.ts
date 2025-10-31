import { Component } from '@angular/core';
import { MedicoFormComponent } from './medico-form/medico-form.component';

@Component({
  selector: 'app-crear-medico',
  standalone: true,
  imports: [MedicoFormComponent],
  template: '<app-medico-form></app-medico-form>'
})
export class CrearMedicoComponent {}
