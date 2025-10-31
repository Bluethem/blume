import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PacienteFormComponent } from './paciente-form/paciente-form.component';

@Component({
  selector: 'app-editar-paciente',
  standalone: true,
  imports: [PacienteFormComponent],
  template: '<app-paciente-form [pacienteId]="pacienteId"></app-paciente-form>'
})
export class EditarPacienteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  pacienteId: string | null = null;

  ngOnInit(): void {
    this.pacienteId = this.route.snapshot.paramMap.get('id');
  }
}
