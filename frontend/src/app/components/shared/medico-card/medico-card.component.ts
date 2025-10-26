import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

export interface Medico {
  id: string | number;
  nombre: string;
  especialidad: string;
  foto?: string;
  rating?: number;
  experiencia?: string;
  precio?: number;
  disponible?: boolean;
}

@Component({
  selector: 'app-medico-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './medico-card.component.html',
  styleUrls: ['./medico-card.component.css']
})
export class MedicoCardComponent {
  @Input() medico!: Medico;
  @Input() showPrice: boolean = false;
  @Input() showRating: boolean = false;
  @Input() showExperience: boolean = false;
  @Input() buttonText: string = 'Seleccionar';
  @Input() buttonVariant: 'primary' | 'secondary' = 'primary';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  
  @Output() medicoClick = new EventEmitter<Medico>();
  @Output() buttonClick = new EventEmitter<Medico>();

  onCardClick(): void {
    if (!this.disabled) {
      this.medicoClick.emit(this.medico);
    }
  }

  onButtonClick(event: Event): void {
    event.stopPropagation();
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(this.medico);
    }
  }

  get fullStars(): number[] {
    if (!this.medico.rating) return [];
    return Array(Math.floor(this.medico.rating)).fill(0);
  }

  get hasHalfStar(): boolean {
    if (!this.medico.rating) return false;
    return this.medico.rating % 1 >= 0.5;
  }

  get emptyStars(): number[] {
    if (!this.medico.rating) return Array(5).fill(0);
    const filled = Math.ceil(this.medico.rating);
    const empty = 5 - filled;
    return Array(empty).fill(0);
  }

  get displayRating(): string {
    if (!this.medico.rating) return '0.0';
    return this.medico.rating.toFixed(1);
  }

  get initials(): string {
    if (!this.medico.nombre) return 'M';
    const names = this.medico.nombre.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  get availabilityClass(): string {
    if (this.disabled) return 'unavailable';
    if (this.medico.disponible === false) return 'unavailable';
    return 'available';
  }
}