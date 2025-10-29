import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ValoracionesService } from '../../../../../services/valoraciones.service';
import { Cita, CreateValoracionRequest } from '../../../../../models';

@Component({
  selector: 'app-modal-valoracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isOpen">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-xl font-semibold text-gray-900">
            Valorar consulta
          </h2>
          <button (click)="cerrar()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Médico info -->
          <div class="text-center pb-4 border-b" *ngIf="cita?.medico">
            <p class="text-sm text-gray-600">¿Cómo fue tu experiencia con</p>
            <p class="font-semibold text-gray-900">{{ cita?.medico?.nombre_profesional }}?</p>
          </div>

          <!-- Calificación -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Calificación <span class="text-red-500">*</span>
            </label>
            <div class="flex justify-center gap-2">
              <button
                *ngFor="let star of [1, 2, 3, 4, 5]"
                type="button"
                (click)="calificacion = star"
                class="focus:outline-none transition-transform hover:scale-110"
              >
                <svg 
                  class="w-10 h-10" 
                  [class.text-yellow-400]="star <= calificacion"
                  [class.text-gray-300]="star > calificacion"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            </div>
            <p class="text-center text-sm text-gray-600 mt-2" *ngIf="calificacion > 0">
              {{ getTextoCalificacion() }}
            </p>
          </div>

          <!-- Comentario -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              [(ngModel)]="comentario"
              rows="4"
              placeholder="Comparte tu experiencia para ayudar a otros pacientes..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxlength="1000"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">{{ comentario.length }}/1000 caracteres</p>
          </div>

          <!-- Anónimo -->
          <div class="flex items-center">
            <input
              type="checkbox"
              [(ngModel)]="anonimo"
              id="anonimo"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="anonimo" class="ml-2 text-sm text-gray-700">
              Publicar como anónimo
            </label>
          </div>

          <!-- Error -->
          <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t bg-gray-50">
          <button
            (click)="cerrar()"
            [disabled]="saving"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            (click)="enviar()"
            [disabled]="!calificacion || saving"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Enviando...' : 'Enviar valoración' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ModalValoracionComponent {
  private valoracionesService = inject(ValoracionesService);

  @Input() isOpen = false;
  @Input() cita: Cita | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  calificacion = 0;
  comentario = '';
  anonimo = false;
  saving = false;
  error = '';

  cerrar(): void {
    if (!this.saving) {
      this.resetForm();
      this.close.emit();
    }
  }

  enviar(): void {
    if (!this.calificacion || !this.cita?.medico?.id) return;

    this.saving = true;
    this.error = '';

    const request: CreateValoracionRequest = {
      valoracion: {
        calificacion: this.calificacion,
        comentario: this.comentario.trim() || undefined,
        anonimo: this.anonimo,
        cita_id: this.cita.id
      }
    };

    this.valoracionesService.crearValoracion(this.cita.medico.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.emit();
          this.resetForm();
          this.close.emit();
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al enviar la valoración';
        this.saving = false;
      }
    });
  }

  getTextoCalificacion(): string {
    const textos = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    return textos[this.calificacion] || '';
  }

  private resetForm(): void {
    this.calificacion = 0;
    this.comentario = '';
    this.anonimo = false;
    this.error = '';
    this.saving = false;
  }
}
