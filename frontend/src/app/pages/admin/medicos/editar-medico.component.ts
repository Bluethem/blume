import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedicoFormComponent } from './medico-form/medico-form.component';

@Component({
  selector: 'app-editar-medico',
  standalone: true,
  imports: [MedicoFormComponent],
  template: '<app-medico-form [medicoId]="medicoId"></app-medico-form>'
})
export class EditarMedicoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  medicoId: string | null = null;

  ngOnInit(): void {
    this.medicoId = this.route.snapshot.paramMap.get('id');
  }
}
