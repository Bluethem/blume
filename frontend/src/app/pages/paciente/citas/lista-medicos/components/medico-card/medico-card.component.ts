import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Medico } from '../../../../../../models/index';

@Component({
  selector: 'app-medico-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medico-card.component.html',
  styleUrls: ['./medico-card.component.css']
})
export class MedicoCardComponent {
  @Input() medico!: Medico;
  @Output() verPerfil = new EventEmitter<void>();
  @Output() agendarCita = new EventEmitter<void>();

  get estadoDisponibilidad() {
    return this.medico.disponible_hoy ? 'disponible' : 'no-disponible';
  }

  get colorEstado() {
    return this.medico.disponible_hoy ? 'bg-green-500' : 'bg-gray-400';
  }
  
}